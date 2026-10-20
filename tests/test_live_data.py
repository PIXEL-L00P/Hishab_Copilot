"""Live data entry and the bilingual API, against the real HTTP server.

Entering a payment, a new due or a new bill must change the numbers the dashboard shows; the change detector
must notice it; roles must still be enforced; and the Bangla page must get Bangla text with the same figures.
"""
import os
import unittest

from tests import test_api


class LiveData(unittest.TestCase):
    """Same server set-up as test_api.Api (fresh database, real HTTP server), without re-running its tests."""
    setUpClass = classmethod(test_api.Api.setUpClass.__func__)
    tearDownClass = classmethod(test_api.Api.tearDownClass.__func__)
    call = classmethod(test_api.Api.call.__func__)

    def _cash(self):
        return self.call("/api/businesses/1/summary", user="farhana")[1]["summary"]["cash_balance"]

    def _version(self, user="farhana"):
        return self.call("/api/businesses/1/version", user=user)[1]["version"]

    def test_customer_payment_adds_cash_once(self):
        recv = self.call("/api/businesses/1/receivables", user="farhana")[1]["receivables"]
        r = [x for x in recv if x["status"] == "open"][0]
        cash0, v0 = self._cash(), self._version()
        s, _, _ = self.call(f"/api/businesses/1/receivables/{r['id']}/paid", "POST", {}, user="rakib")  # accountant may
        self.assertEqual(s, 200)
        self.assertEqual(self._cash(), round(cash0 + r["amount"]))
        self.assertGreater(self._version(), v0)
        s, _, _ = self.call(f"/api/businesses/1/receivables/{r['id']}/paid", "POST", {}, user="farhana")
        self.assertEqual(s, 409)                                   # cannot be paid twice
        self.assertEqual(self._cash(), round(cash0 + r["amount"]))

    def test_new_bill_lowers_projection_and_paying_it_moves_cash(self):
        low0 = self.call("/api/businesses/1/cash", user="farhana")[1]["expected"]["min_cash"]
        s, b, _ = self.call("/api/businesses/1/payables", "POST", {"counterparty": "Test Supplier", "amount": 50000,
                            "due_date": "2026-10-28", "category": "supplier", "flexible": True}, user="farhana")
        self.assertEqual(s, 200)
        low1 = self.call("/api/businesses/1/cash", user="farhana")[1]["expected"]["min_cash"]
        self.assertAlmostEqual(low1, low0 - 50000, delta=2)
        cash0 = self._cash()
        s, _, _ = self.call(f"/api/businesses/1/payables/{b['payable_id']}/paid", "POST", {}, user="farhana")
        self.assertEqual(s, 200)
        self.assertEqual(self._cash(), round(cash0 - 50000))
        low2 = self.call("/api/businesses/1/cash", user="farhana")[1]["expected"]["min_cash"]
        self.assertAlmostEqual(low2, low1, delta=2)                # paid now instead of later: same low point

    def test_only_supplier_bills_can_be_flexible(self):
        s, b, _ = self.call("/api/businesses/1/payables", "POST", {"counterparty": "Landlord", "amount": 1000,
                            "due_date": "2026-11-01", "category": "rent", "flexible": True}, user="farhana")
        self.assertEqual(s, 200)
        bills = self.call("/api/businesses/1/payables", user="farhana")[1]["payables"]
        self.assertEqual([x for x in bills if x["id"] == b["payable_id"]][0]["flexible"], 0)

    def test_entry_permissions_and_isolation(self):
        body = {"customer_name": "X", "amount": 1000, "due_date": "2026-11-20"}
        self.assertEqual(self.call("/api/businesses/1/receivables", "POST", body, user="lender_demo")[0], 403)
        self.assertEqual(self.call("/api/businesses/1/receivables", "POST", body, user="owner2")[0], 403)
        self.assertEqual(self.call("/api/businesses/1/version", user="owner2")[0], 403)
        self.assertEqual(self.call("/api/businesses/1/receivables", "POST", body)[0], 401)
        other = self.call("/api/businesses/2/receivables", user="owner2")[1]["receivables"][0]["id"]
        self.assertEqual(self.call(f"/api/businesses/1/receivables/{other}/paid", "POST", {}, user="farhana")[0], 404)

    def test_entry_validation(self):
        bad = [{"customer_name": "", "amount": 1000, "due_date": "2026-11-20"},
               {"customer_name": "A", "amount": -5, "due_date": "2026-11-20"},
               {"customer_name": "A", "amount": 1000, "due_date": "soon"},
               {"customer_name": "A", "amount": 1000, "due_date": "2026-11-20", "customer_phone": "<script>"}]
        for b in bad:
            self.assertEqual(self.call("/api/businesses/1/receivables", "POST", b, user="farhana")[0], 400, b)

    def test_bangla_text_same_numbers(self):
        en = self.call("/api/businesses/1/benchmark?lang=en", user="farhana")[1]
        bn = self.call("/api/businesses/1/benchmark?lang=bn", user="farhana")[1]
        self.assertEqual([m.get("percentile_rank") for m in en["metrics"]], [m.get("percentile_rank") for m in bn["metrics"]])
        self.assertIn("মার্জিন", bn["metrics"][0]["label"])
        f = self.call("/api/businesses/1/financing?amount=210000&lang=bn", user="farhana")[1]
        fe = self.call("/api/businesses/1/financing?amount=210000&lang=en", user="farhana")[1]
        self.assertEqual([o["monthly_instalment"] for o in f["options"]], [o["monthly_instalment"] for o in fe["options"]])
        self.assertTrue(any("ঋণ" in o["name"] for o in f["options"]))
        self.assertEqual(self.call("/api/businesses/1/benchmark?lang=fr", user="farhana")[0], 400)
        os.environ["HISHAB_LLM"] = "off"
        r = self.call("/api/businesses/1/agent/chat", "POST", {"message": "How is my cash flow?", "language": "bn"},
                      user="farhana")[1]
        self.assertEqual(r["language"], "bn")


if __name__ == "__main__":
    unittest.main()

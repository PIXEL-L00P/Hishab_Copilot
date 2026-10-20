"""Approval safety under concurrency and changing data.

These tests use separate database connections in separate threads, the same way the web server handles
simultaneous requests (one connection per request).
"""
import threading
import unittest

from tests.helpers import ctx, fresh_db
from app import agent, audit, db


def count(conn, sql, *args):
    return conn.execute(sql, args).fetchone()[0]


class SimultaneousApprovals(unittest.TestCase):
    def setUp(self):
        self.path, self.conn = fresh_db()
        self.owner = ctx(self.conn, "farhana")
        self.rid = self.conn.execute(
            "SELECT id FROM receivables WHERE customer_name = 'Karim Traders' AND business_id = 1").fetchone()["id"]

    def _race(self, action_id, n=8, approve=True):
        """Fire n approve/reject calls for the same action at the same moment, each on its own connection."""
        barrier = threading.Barrier(n)
        results, lock = [], threading.Lock()

        def worker():
            c = db.connect(self.path)
            try:
                barrier.wait()
                out = agent.decide(c, self.owner.user, action_id, approve)
                res = ("ok", out["status"])
            except ValueError as e:
                res = ("refused", str(e))
            except Exception as e:  # anything else is a test failure
                res = ("error", repr(e))
            finally:
                c.close()
            with lock:
                results.append(res)

        threads = [threading.Thread(target=worker) for _ in range(n)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(30)
        return results

    def test_reminder_sent_exactly_once(self):
        a = agent.call_tool(self.owner, "send_payment_reminder", {"receivable_id": self.rid})
        results = self._race(a["action_id"])
        self.assertEqual([r for r in results if r[0] == "error"], [])
        self.assertEqual(sum(r[0] == "ok" for r in results), 1, results)
        self.assertEqual(count(self.conn, "SELECT COUNT(*) FROM outbox WHERE action_id = ?", a["action_id"]), 1)
        self.assertEqual(count(self.conn, "SELECT COUNT(*) FROM audit_log WHERE event = 'agent_action_approved'"), 1)

    def test_supplier_request_applied_exactly_once(self):
        p = self.conn.execute("SELECT id, due_date FROM payables WHERE business_id = 1 AND flexible = 1 "
                              "AND status = 'open' ORDER BY amount DESC LIMIT 1").fetchone()
        from datetime import date, timedelta
        new_due = (date.fromisoformat(p["due_date"]) + timedelta(weeks=2)).isoformat()
        a = agent.call_tool(self.owner, "request_supplier_extension", {"payable_id": p["id"], "proposed_due": new_due})
        self.assertEqual(a["status"], "pending_approval")
        results = self._race(a["action_id"])
        self.assertEqual(sum(r[0] == "ok" for r in results), 1, results)
        self.assertEqual(count(self.conn, "SELECT COUNT(*) FROM outbox WHERE action_id = ?", a["action_id"]), 1)

    def test_approve_and_reject_at_once_only_one_wins(self):
        a = agent.call_tool(self.owner, "send_payment_reminder", {"receivable_id": self.rid})
        barrier = threading.Barrier(2)
        out = {}

        def worker(flag):
            c = db.connect(self.path)
            try:
                barrier.wait()
                out[flag] = agent.decide(c, self.owner.user, a["action_id"], flag)["status"]
            except ValueError:
                out[flag] = "refused"
            finally:
                c.close()

        ts = [threading.Thread(target=worker, args=(f,)) for f in (True, False)]
        [t.start() for t in ts]
        [t.join(30) for t in ts]
        self.assertEqual(sorted(out.values()).count("refused"), 1, out)
        status = self.conn.execute("SELECT status FROM agent_actions WHERE id = ?", (a["action_id"],)).fetchone()[0]
        sent = count(self.conn, "SELECT COUNT(*) FROM outbox WHERE action_id = ?", a["action_id"])
        self.assertEqual(sent, 1 if status == "approved" else 0)

    def test_audit_chain_stays_valid_under_concurrent_writes(self):
        barrier = threading.Barrier(10)

        def worker(i):
            c = db.connect(self.path)
            try:
                barrier.wait()
                for k in range(5):
                    audit.log(c, None, 1, "concurrency_test", {"worker": i, "k": k})
            finally:
                c.close()

        ts = [threading.Thread(target=worker, args=(i,)) for i in range(10)]
        [t.start() for t in ts]
        [t.join(30) for t in ts]
        self.assertEqual(count(self.conn, "SELECT COUNT(*) FROM audit_log WHERE event = 'concurrency_test'"), 50)
        self.assertTrue(audit.verify_chain(self.conn)["valid"])


class StaleApprovals(unittest.TestCase):
    def setUp(self):
        self.path, self.conn = fresh_db()
        self.owner = ctx(self.conn, "farhana")
        self.rid = self.conn.execute(
            "SELECT id FROM receivables WHERE customer_name = 'Karim Traders' AND business_id = 1").fetchone()["id"]

    def test_customer_paid_before_approval_nothing_sent(self):
        a = agent.call_tool(self.owner, "send_payment_reminder", {"receivable_id": self.rid})
        self.conn.execute("UPDATE receivables SET status = 'paid' WHERE id = ?", (self.rid,))
        self.conn.commit()
        with self.assertRaises(ValueError) as e:
            agent.decide(self.conn, self.owner.user, a["action_id"], True)
        self.assertIn("Not sent", str(e.exception))
        self.assertEqual(count(self.conn, "SELECT COUNT(*) FROM outbox"), 0)
        self.assertEqual(self.conn.execute("SELECT status FROM agent_actions WHERE id = ?",
                                           (a["action_id"],)).fetchone()[0], "stale")

    def test_amount_changed_before_approval_nothing_sent(self):
        a = agent.call_tool(self.owner, "send_payment_reminder", {"receivable_id": self.rid})
        self.conn.execute("UPDATE receivables SET amount = amount + 5000 WHERE id = ?", (self.rid,))
        self.conn.commit()
        with self.assertRaises(ValueError):
            agent.decide(self.conn, self.owner.user, a["action_id"], True)
        self.assertEqual(count(self.conn, "SELECT COUNT(*) FROM outbox"), 0)

    def test_stale_action_cannot_be_approved_later(self):
        a = agent.call_tool(self.owner, "send_payment_reminder", {"receivable_id": self.rid})
        self.conn.execute("UPDATE receivables SET status = 'paid' WHERE id = ?", (self.rid,))
        self.conn.commit()
        with self.assertRaises(ValueError):
            agent.decide(self.conn, self.owner.user, a["action_id"], True)
        self.conn.execute("UPDATE receivables SET status = 'open' WHERE id = ?", (self.rid,))
        self.conn.commit()
        with self.assertRaises(ValueError):            # single-use: a stale action stays dead
            agent.decide(self.conn, self.owner.user, a["action_id"], True)
        self.assertEqual(count(self.conn, "SELECT COUNT(*) FROM outbox"), 0)


if __name__ == "__main__":
    unittest.main()

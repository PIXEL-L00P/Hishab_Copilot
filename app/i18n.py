"""Bangla versions of the text the server generates (financing reasons, peer-benchmark labels and tips,
approval summaries).

The calculations stay in one place (financing.py, benchmark.py, agent.py) and always produce English; this module
only rewrites the finished, human-readable strings when the page is in Bangla. Numbers are copied across
unchanged, so both languages always show the same figures.
"""
import copy
import re

AMT = r"(-?৳[\d,]+)"

PRODUCT_BN = {
    "Supplier trade-credit extension": "সরবরাহকারীর বাকির মেয়াদ বাড়ানো",
    "Digital merchant working-capital loan": "ডিজিটাল মার্চেন্ট চলতি মূলধন ঋণ",
    "Bank SME working-capital loan": "ব্যাংকের এসএমই চলতি মূলধন ঋণ",
    "Refinance-scheme CMSME loan (via participating bank)": "পুনঃঅর্থায়ন স্কিমের সিএমএসএমই ঋণ (অংশগ্রহণকারী ব্যাংক)",
    "Women entrepreneur SME loan (participating bank)": "নারী উদ্যোক্তা এসএমই ঋণ (অংশগ্রহণকারী ব্যাংক)",
    "Microfinance enterprise loan": "ক্ষুদ্রঋণ প্রতিষ্ঠানের উদ্যোগ ঋণ",
}

REASONS_BN = [
    (rf"^covers at most {AMT} of the {AMT} needed$", r"সর্বোচ্চ \1 দেয়, কিন্তু প্রয়োজন \2"),
    (r"^needs (\d+) months in business \(has (\d+)\)$", r"ব্যবসার বয়স অন্তত \1 মাস লাগবে (আছে \2 মাস)"),
    (r"^(\d+) months in business$", r"ব্যবসার বয়স \1 মাস"),
    (rf"^needs monthly sales of {AMT} \(has {AMT}\)$", r"মাসিক বিক্রি অন্তত \1 লাগবে (আছে \2)"),
    (r"^requires collateral, which the business has not listed$", "জামানত লাগবে, যা ব্যবসাটি দেখায়নি"),
    (r"^requires a valid trade licence$", "বৈধ ট্রেড লাইসেন্স লাগবে"),
    (r"^women-led business qualifies for the concessional scheme$", "নারী-নেতৃত্বাধীন ব্যবসা হিসেবে স্বল্প সুদের স্কিমে যোগ্য"),
    (r"^only for women-led businesses$", "শুধু নারী-নেতৃত্বাধীন ব্যবসার জন্য"),
    (r"^defers existing supplier bills.*$", "বিদ্যমান সরবরাহকারী বিল পিছিয়ে দেয় (শুধু সময় পাওয়া যায়; বিল পরে দিতেই হবে)"),
    (r"^repayments would take too much of cash flow \(DSCR ([\d.]+) < ([\d.]+)\)$",
     r"কিস্তি নগদ প্রবাহের খুব বড় অংশ নেবে (DSCR \1 < \2)"),
    (r"^affordable: DSCR ([\d.]+) \(≥ ([\d.]+)\)$", r"সাধ্যের মধ্যে: DSCR \1 (≥ \2)"),
]

METRIC_BN = {
    "gross_margin": "মোট লাভের হার (গ্রস মার্জিন)",
    "sales_growth_yoy": "গত বছরের তুলনায় বিক্রি বৃদ্ধি (১২ সপ্তাহ)",
    "fixed_cost_ratio": "বিক্রির তুলনায় ভাড়া + বেতন + অন্যান্য খরচ",
    "overdue_ratio": "মাসিক বিক্রির তুলনায় বকেয়া পাওনা",
    "cash_buffer_weeks": "নগদ মজুত (কত সপ্তাহের খরচ)",
    "dscr": "ঋণ পরিশোধ সক্ষমতা (DSCR)",
}

TIP_BN = {
    "gross_margin": "অন্যদের মাঝামাঝি হারে লাভ করলে মাসে প্রায় {a} বেশি লাভ হবে। সরবরাহকারীর দাম আর ধীরে বিক্রি হওয়া মালের ছাড় দেখুন।",
    "fixed_cost_ratio": "একই বিক্রিতে অনুরূপ দোকানের চেয়ে আপনার নির্দিষ্ট খরচ মাসে প্রায় {a} বেশি। সাধারণত ভাড়া আর কর্মী খরচেই সুযোগ থাকে।",
    "overdue_ratio": "বকেয়া পাওনা অন্যদের পর্যায়ে নামালে প্রায় {a} নগদ হাতে আসবে। এজেন্টকে রিমাইন্ডার পাঠাতে বলুন, আর বারবার দেরি করা ক্রেতার জন্য বাকির সীমা ঠিক করুন।",
    "cash_buffer_weeks": "অনুরূপ দোকানগুলো বেশি নগদ মজুত রাখে। নতুন মাল কেনার আগে প্রতি ঈদের বাড়তি আয়ের একটা অংশ জমা রাখুন।",
    "sales_growth_yoy": "অনুরূপ দোকানের চেয়ে আপনার বিক্রি ধীরে বাড়ছে। মৌসুমের চাহিদার সাথে আপনার সেরা পণ্য আর দাম মিলিয়ে দেখুন।",
    "dscr": "অনুরূপ দোকানের চেয়ে ঋণের কিস্তি আপনার নগদ প্রবাহের বড় অংশ নিচ্ছে। এটি ভালো না হওয়া পর্যন্ত নতুন ঋণ এড়িয়ে চলুন।",
}

SUMMARY_BN = [
    (rf"^Send a payment reminder to (.+) for {AMT}$", r"\1-কে \2 পরিশোধের রিমাইন্ডার পাঠানো"),
    (rf"^Ask (.+) to move {AMT} from (\S+) to (\S+)$", r"\1-কে \2-এর বিল \3 থেকে \4-এ সরানোর অনুরোধ"),
    (r"^Share the loan-readiness report with (.+)$", r"\1-এর সাথে ঋণ-প্রস্তুতি রিপোর্ট শেয়ার করা"),
]


def _sub(patterns, text):
    if not isinstance(text, str):
        return text
    for rx, rep in patterns:
        if re.match(rx, text):
            return re.sub(rx, rep, text)
    return text


def financing(fin: dict, lang: str) -> dict:
    if lang != "bn" or not fin:
        return fin
    f = copy.deepcopy(fin)
    for o in f.get("options", []):
        o["name"] = PRODUCT_BN.get(o["name"], o["name"])
        o["why_eligible"] = [_sub(REASONS_BN, r) for r in o["why_eligible"]]
        o["why_not"] = [_sub(REASONS_BN, r) for r in o["why_not"]]
        o["indicative_rate"] = re.sub(r"^(.+) per year$", r"বছরে \1", o["indicative_rate"])
    f["disclaimer"] = ("এই প্রোটোটাইপের ঋণের শর্তগুলো উদাহরণমাত্র। চূড়ান্ত যোগ্যতা ও সুদের হার ঋণদাতা ঠিক করবে; "
                       "HishabAI কোনো ঋণ অনুমোদন বা আবেদন জমা দেয় না।")
    return f


def benchmark(b: dict, lang: str) -> dict:
    if lang != "bn" or not b:
        return b
    b = copy.deepcopy(b)
    if not b.get("available"):
        b["message"] = "গোপনীয়তা রক্ষা করে তুলনা করার মতো যথেষ্ট অনুরূপ ব্যবসা এখনো নেই (অন্তত ৫টি লাগবে)।"
        return b
    for m in b["metrics"]:
        m["label"] = METRIC_BN.get(m["metric"], m["label"])
        for k in ("you_display", "median_display"):
            if isinstance(m.get(k), str):
                m[k] = m[k].replace(" weeks", " সপ্তাহ")
        if m.get("tip"):
            amt = re.search(AMT, m["tip"])
            m["tip"] = TIP_BN.get(m["metric"], m["tip"]).format(a=amt.group(1) if amt else "")
    b["strengths"] = [METRIC_BN.get(k, k) for k in
                      [m["metric"] for m in b["metrics"] if m.get("status") == "strong"]]
    b["needs_attention"] = [{"label": m["label"], "tip": m["tip"]} for m in b["metrics"] if m.get("tip")]
    n = b["peer_group"]["peer_count"]
    b["privacy"] = (f"{n}টি নাম-গোপন অনুরূপ ব্যবসার সাথে তুলনা। শুধু মাঝামাঝি মান ও চতুর্থাংশ দেখানো হয়; "
                    f"কোনো একক ব্যবসাকে চেনা যায় না।")
    b["data_note"] = "এই প্রোটোটাইপের তুলনার ডেটা কৃত্রিম (সিনথেটিক)।"
    return b


def summary(text: str, lang: str) -> str:
    return _sub(SUMMARY_BN, text) if lang == "bn" else text


def actions(rows: list, lang: str) -> list:
    if lang != "bn":
        return rows
    out = []
    for a in rows:
        a = dict(a)
        if a.get("summary"):
            a["summary"] = summary(a["summary"], lang)
        out.append(a)
    return out


def text(s: str, lang: str) -> str:
    """Product names inside a free-text Bangla reply or briefing."""
    if lang != "bn" or not isinstance(s, str):
        return s
    for en, bn in sorted(PRODUCT_BN.items(), key=lambda kv: -len(kv[0])):
        s = s.replace(en, bn)
    return re.sub(r"([\d.–-]+%) per year", r"বছরে \1", s)


def cash_check(res: dict, lang: str) -> dict:
    if lang != "bn":
        return res
    res = dict(res)
    res["briefing"] = text(res.get("briefing"), lang)
    res["financing"] = financing(res.get("financing"), lang)
    res["pending_approvals"] = [dict(p, summary=summary(p["summary"], lang)) for p in res.get("pending_approvals", [])]
    return res

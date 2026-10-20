"use strict";
// HishabAI front end. Plain JavaScript, no libraries. All text is inserted with textContent (never innerHTML
// with data), so customer notes and other untrusted text cannot run as code.
//
// The page is fully bilingual (English / Bangla) and live: it re-reads the shop's data whenever anything changes,
// including changes made by another user (for example the accountant adds a week while the owner is watching).

const state = { token: null, user: null, bid: null, role: null, lang: "en", version: null, busy: 0,
  cash: null, summary: null, last: null, plan: null, finQuery: null, checked: false, tab: "dues", entry: "week" };
const $ = (id) => document.getElementById(id);

// ------------------------------------------------------------------ text (English / Bangla)
const STR = {
  en: {
    tagline: "SME Finance Copilot", logout: "Log out", live: "Live", liveTitle: "Live: updates automatically when anything changes",
    synth: "Prototype with synthetic demo data. The agent never moves money; messages go to a sandbox outbox.",
    signIn: "Sign in", demoAccounts: "Demo accounts (synthetic data):", demoOwner: "Owner · Farhana",
    demoAcct: "Accountant · Rakib", demoLender: "Lender · Demo Bank", username: "Username", password: "Password",
    runCheck: "Run cash check", analysing: "Analysing…",
    salesTitle: "Sales: last 26 weeks and AI forecast", cashTitle: "Cash projection (next 8 weeks)",
    cashNote: "Red line = zero. Dashed line = safety buffer. The green line appears after a payment plan is drafted.",
    forecastNote: "Model: {m}. Blue dashes = forecast; shaded area = calibrated 80% range.",
    legendExpected: "Expected", legendWeak: "If sales are weak", legendAfter: "After plan",
    entryTitle: "Update your records", entryNote: "Everything above recalculates as soon as you save: forecast, cash projection, alert and benchmark.",
    entryWeek: "Next week's figures", entryDue: "New customer due (baki)", entryBill: "New bill to pay",
    weekOf: "Week starting", prefilled: "pre-filled from last week; change any number",
    f_sales: "Total sales", f_credit: "of which on credit (baki)", f_collected: "Dues collected", f_stock: "Stock purchases",
    f_rent: "Rent paid", f_salaries: "Salaries paid", f_utilities: "Utilities", f_other: "Other expenses",
    f_loan: "Loan instalments paid", f_drawings: "Owner took out", closingCash: "Closing cash (calculated)",
    saveWeek: "Save week", appendOnly: "Past weeks cannot be edited (append-only for audit).",
    f_customer: "Customer name", f_phone: "Phone", f_amount: "Amount (৳)", f_due: "Due date", f_note: "Note",
    addDue: "Add due", f_payto: "Pay to", f_for: "For", f_category: "Type", f_flexible: "Supplier may allow more time",
    addBill: "Add bill", cat_supplier: "Supplier", cat_utility: "Utility", cat_rent: "Rent", cat_salary: "Salary",
    cat_tax: "Tax", cat_other: "Other",
    savedWeek: "Week of {d} saved. Forecast and cash projection updated.", savedDue: "Customer due added.",
    savedBill: "Bill added. Cash projection updated.", paidDue: "Payment recorded: {a} added to cash.",
    paidBill: "Bill paid: {a} taken from cash.", creditTooHigh: "Credit sales cannot be more than total sales.",
    readOnlyEntry: "Your role can view but not change records.",
    benchTitle: "How you compare with similar shops", benchOverall: "Overall you do better than about {p}% of them.",
    measure: "Measure", you: "You", peerMedian: "Peer median", rank: "Rank", betterThan: "better than {p}%",
    briefingTitle: "Agent briefing", briefingEmpty: "Press “Run cash check” to let the agent analyse the next 8 weeks.",
    waiting: "Waiting for approval", nothingPending: "Nothing pending.", approve: "Approve", reject: "Reject",
    ownerNeeded: "Owner approval needed", message: "Message", tier: "Tier",
    approved: "Approved. The message is in the sandbox outbox.", rejected: "Rejected. Nothing was sent.",
    askTitle: "Ask HishabAI", chatPh: "e.g. Can I afford a second shop?", send: "Send", tools: "tools",
    whatIf: "What-if simulator", whatIfNote: "Results update as you type.",
    s_sales: "Sales change (%)", s_stock: "Stock cost change (%)", s_extra: "Extra monthly costs (৳)",
    s_once: "One-time cost (৳)", s_loan: "New loan (৳)", s_rate: "Loan rate (% / year)", s_months: "Loan months",
    p_shop2: "Second shop", p_drop: "Sales −20%", p_reset: "Reset",
    now: "Now", scenario: "Scenario", lowestCash: "Lowest cash, next 8 weeks", monthlyProfit: "Monthly profit (approx.)",
    newInstalment: "New loan instalment", affordable: "Affordable: cash stays above the safety buffer.",
    notAffordable: "Not affordable: cash falls below the safety buffer or profit turns negative.",
    finTitle: "Financing options", finEmpty: "Run the cash check, or ask about financing.",
    need: "Need: {a}", needBy: " by {d}", option: "Option", status: "Status", monthly: "Monthly", rate: "Rate",
    estDays: "Est. days to funding", likelyEligible: "Likely eligible", eligibleSlow: "Likely eligible, too slow",
    notEligible: "Not eligible", days: "{n} days",
    tabDues: "Customer dues", tabBills: "Bills to pay", tabOutbox: "Sandbox outbox", tabActions: "Agent action log", tabAudit: "Audit trail",
    customer: "Customer", amount: "Amount", due: "Due", note: "Note (untrusted text)", payTo: "Pay to", for: "For",
    flexible: "Flexible", yes: "yes", no: "no", markPaid: "Mark paid", remind: "Ask agent to remind",
    remindQueued: "Reminder drafted. It waits for the owner's approval.",
    time: "Time", channel: "Channel", to: "To", tool: "Tool", event: "Event", detail: "Detail", timeUtc: "Time (UTC)",
    onlyOwnerOutbox: "Only the owner can view sent messages.", onlyOwnerAudit: "Only the owner can view the audit trail.",
    noOutbox: "No messages sent yet. Approved reminders and requests appear here (sandbox, not real SMS).",
    chainOk: "Hash chain verified: {n} entries, no tampering detected.", chainBad: "Hash chain BROKEN at entry {n}.",
    lenderTitle: "Reports shared with you", lenderNote: "You only see what a business owner has explicitly approved to share.",
    noReports: "No reports have been shared with you yet.", shared: "shared", figure: "Figure", value: "Value",
    k_avgSales: "Average monthly sales", k_margin: "Gross margin (est.)", k_opcash: "Operating cash flow / month",
    k_debt: "Existing debt service / month", k_overdue: "Overdue receivables", k_payables: "Open payables",
    k_inject: "Owner put in from outside (52 weeks)", k_injectVal: "{a} in {n} week(s)",
    peerLine: "Peer comparison: better than about {p}% of {n} similar shops (anonymised).",
    updated: "Updated with the latest data.", error: "Error",
    t_critical: "Cash shortfall ahead", t_warning: "Cash is getting tight", t_healthy: "Cash flow looks healthy",
    a_healthy: "Lowest expected balance in the next 8 weeks: {a}.",
    a_below: "Expected to drop below {what} in the week of {d}; lowest {a} in the week of {d2}.",
    zero: "zero", buffer: "your safety buffer",
    kp_cash: "Cash in hand", kp_runway: "runway ≈ {n} weeks", kp_sales: "Sales, last 12 weeks", kp_yoy: "vs last year {p}",
    kp_margin: "Gross margin", kp_marginSub: "estimated from stock purchases", kp_be: "Break-even sales", kp_month: "per month",
    kp_dscr: "Debt coverage (DSCR)", kp_inst: "instalments {a}/month", kp_overdue: "Overdue customer dues", kp_cust: "{n} customer(s)",
    role_owner: "owner", role_accountant: "accountant", role_lender: "lender",
    st_open: "open", st_paid: "paid", st_extension_requested: "extension requested", st_pending_approval: "pending approval",
    st_approved: "approved", st_rejected: "rejected", st_expired: "expired", st_stale: "stale (data changed)",
    st_blocked: "blocked", st_denied: "denied", st_executed: "executed", st_drafted: "drafted",
    st_strong: "strong", st_average: "average", st_attention: "attention",
    chips: { second: ["Second shop?", "Can I afford to open a second shop?"], drop: ["Sales −20%?", "What if sales drop 20%?"],
      compare: ["Compare", "Am I more profitable than similar shops?"], finance: ["Financing", "Find financing options"],
      transfer: ["Transfer money", "Transfer 50000 to Nur Fabrics now"], cash: ["Cash status", "How is my cash flow?"] },
    monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
  bn: {
    tagline: "এসএমই ফাইন্যান্স কোপাইলট", logout: "লগ আউট", live: "লাইভ", liveTitle: "লাইভ: কিছু বদলালেই নিজে থেকে আপডেট হয়",
    synth: "প্রোটোটাইপ, কৃত্রিম (সিনথেটিক) ডেমো ডেটা। এজেন্ট কখনো টাকা পাঠায় না; বার্তাগুলো স্যান্ডবক্স আউটবক্সে যায়।",
    signIn: "সাইন ইন", demoAccounts: "ডেমো অ্যাকাউন্ট (কৃত্রিম ডেটা):", demoOwner: "মালিক · ফারহানা",
    demoAcct: "হিসাবরক্ষক · রাকিব", demoLender: "ঋণদাতা · ডেমো ব্যাংক", username: "ইউজারনেম", password: "পাসওয়ার্ড",
    runCheck: "ক্যাশ চেক করুন", analysing: "বিশ্লেষণ চলছে…",
    salesTitle: "বিক্রি: গত ২৬ সপ্তাহ ও এআই পূর্বাভাস", cashTitle: "নগদ টাকার পূর্বাভাস (আগামী ৮ সপ্তাহ)",
    cashNote: "লাল রেখা = শূন্য। ড্যাশ রেখা = নিরাপত্তা মজুত। পেমেন্ট পরিকল্পনা তৈরি হলে সবুজ রেখা দেখা যায়।",
    forecastNote: "মডেল: {m}। নীল ড্যাশ = পূর্বাভাস; ছায়াযুক্ত অংশ = ক্যালিব্রেটেড ৮০% সম্ভাব্য সীমা।",
    legendExpected: "প্রত্যাশিত", legendWeak: "বিক্রি কম হলে", legendAfter: "পরিকল্পনার পরে",
    entryTitle: "হিসাব হালনাগাদ করুন", entryNote: "সেভ করলেই ওপরের সবকিছু নতুন করে হিসাব হয়: পূর্বাভাস, নগদ পূর্বাভাস, সতর্কতা ও তুলনা।",
    entryWeek: "পরের সপ্তাহের হিসাব", entryDue: "নতুন বাকি (ক্রেতার পাওনা)", entryBill: "নতুন বিল",
    weekOf: "সপ্তাহ শুরু", prefilled: "গত সপ্তাহের হিসাব বসানো আছে; যেকোনো সংখ্যা বদলান",
    f_sales: "মোট বিক্রি", f_credit: "এর মধ্যে বাকিতে", f_collected: "আদায় হওয়া বাকি", f_stock: "মাল কেনা",
    f_rent: "ভাড়া দেওয়া", f_salaries: "বেতন দেওয়া", f_utilities: "বিদ্যুৎ-পানি-গ্যাস", f_other: "অন্যান্য খরচ",
    f_loan: "ঋণের কিস্তি দেওয়া", f_drawings: "মালিক তুলেছেন", closingCash: "সপ্তাহ শেষের নগদ (হিসাব করা)",
    saveWeek: "সপ্তাহ সেভ করুন", appendOnly: "আগের সপ্তাহ বদলানো যায় না (অডিটের জন্য শুধু যোগ করা যায়)।",
    f_customer: "ক্রেতার নাম", f_phone: "ফোন", f_amount: "টাকার পরিমাণ (৳)", f_due: "পরিশোধের তারিখ", f_note: "নোট",
    addDue: "বাকি যোগ করুন", f_payto: "কাকে দিতে হবে", f_for: "কিসের জন্য", f_category: "ধরন", f_flexible: "সরবরাহকারী সময় বাড়াতে পারে",
    addBill: "বিল যোগ করুন", cat_supplier: "সরবরাহকারী", cat_utility: "ইউটিলিটি", cat_rent: "ভাড়া", cat_salary: "বেতন",
    cat_tax: "কর", cat_other: "অন্যান্য",
    savedWeek: "{d} সপ্তাহের হিসাব সেভ হয়েছে। পূর্বাভাস ও নগদ পূর্বাভাস হালনাগাদ হয়েছে।", savedDue: "ক্রেতার বাকি যোগ হয়েছে।",
    savedBill: "বিল যোগ হয়েছে। নগদ পূর্বাভাস হালনাগাদ হয়েছে।", paidDue: "পরিশোধ নথিভুক্ত: নগদে {a} যোগ হয়েছে।",
    paidBill: "বিল পরিশোধ: নগদ থেকে {a} কমেছে।", creditTooHigh: "বাকিতে বিক্রি মোট বিক্রির চেয়ে বেশি হতে পারে না।",
    readOnlyEntry: "আপনার ভূমিকায় হিসাব দেখা যায়, বদলানো যায় না।",
    benchTitle: "অনুরূপ দোকানের সাথে তুলনা", benchOverall: "সব মিলিয়ে আপনি প্রায় {p}% দোকানের চেয়ে ভালো করছেন।",
    measure: "মাপকাঠি", you: "আপনি", peerMedian: "অন্যদের মাঝামাঝি", rank: "অবস্থান", betterThan: "{p}% এর চেয়ে ভালো",
    briefingTitle: "এজেন্টের সারসংক্ষেপ", briefingEmpty: "আগামী ৮ সপ্তাহ বিশ্লেষণ করতে “ক্যাশ চেক করুন” চাপুন।",
    waiting: "অনুমোদনের অপেক্ষায়", nothingPending: "অপেক্ষমাণ কিছু নেই।", approve: "অনুমোদন", reject: "বাতিল",
    ownerNeeded: "মালিকের অনুমোদন লাগবে", message: "বার্তা", tier: "স্তর",
    approved: "অনুমোদিত। বার্তাটি স্যান্ডবক্স আউটবক্সে আছে।", rejected: "বাতিল করা হয়েছে। কিছুই পাঠানো হয়নি।",
    askTitle: "HishabAI-কে জিজ্ঞেস করুন", chatPh: "যেমন: নতুন দোকান খুললে কী হবে?", send: "পাঠান", tools: "টুল",
    whatIf: "যদি-তাহলে হিসাব", whatIfNote: "টাইপ করার সাথে সাথে ফলাফল বদলায়।",
    s_sales: "বিক্রির পরিবর্তন (%)", s_stock: "মালের দামের পরিবর্তন (%)", s_extra: "মাসে বাড়তি খরচ (৳)",
    s_once: "এককালীন খরচ (৳)", s_loan: "নতুন ঋণ (৳)", s_rate: "সুদের হার (% / বছর)", s_months: "ঋণের মেয়াদ (মাস)",
    p_shop2: "দ্বিতীয় দোকান", p_drop: "বিক্রি −20%", p_reset: "আগের মতো",
    now: "এখন", scenario: "পরিস্থিতি", lowestCash: "আগামী ৮ সপ্তাহে সর্বনিম্ন নগদ", monthlyProfit: "মাসিক লাভ (আনুমানিক)",
    newInstalment: "নতুন ঋণের কিস্তি", affordable: "সাধ্যের মধ্যে: নগদ নিরাপত্তা মজুতের ওপরে থাকে।",
    notAffordable: "সাধ্যের বাইরে: নগদ নিরাপত্তা মজুতের নিচে নামে বা লাভ ঋণাত্মক হয়।",
    finTitle: "ঋণ ও অর্থায়নের বিকল্প", finEmpty: "ক্যাশ চেক চালান, অথবা ঋণের কথা জিজ্ঞেস করুন।",
    need: "প্রয়োজন: {a}", needBy: ", {d} এর মধ্যে", option: "বিকল্প", status: "অবস্থা", monthly: "মাসিক", rate: "সুদ",
    estDays: "টাকা পেতে আনুমানিক দিন", likelyEligible: "সম্ভবত যোগ্য", eligibleSlow: "সম্ভবত যোগ্য, কিন্তু দেরি",
    notEligible: "যোগ্য নয়", days: "{n} দিন",
    tabDues: "ক্রেতার বাকি", tabBills: "পরিশোধযোগ্য বিল", tabOutbox: "স্যান্ডবক্স আউটবক্স", tabActions: "এজেন্টের কাজের তালিকা", tabAudit: "অডিট ট্রেইল",
    customer: "ক্রেতা", amount: "পরিমাণ", due: "তারিখ", note: "নোট (অবিশ্বস্ত লেখা)", payTo: "যাকে দিতে হবে", for: "কিসের জন্য",
    flexible: "সময় বাড়ানো যায়", yes: "হ্যাঁ", no: "না", markPaid: "পরিশোধিত", remind: "এজেন্টকে রিমাইন্ডার দিতে বলুন",
    remindQueued: "রিমাইন্ডার তৈরি হয়েছে। এটি মালিকের অনুমোদনের অপেক্ষায়।",
    time: "সময়", channel: "মাধ্যম", to: "প্রাপক", tool: "টুল", event: "ঘটনা", detail: "বিস্তারিত", timeUtc: "সময় (UTC)",
    onlyOwnerOutbox: "শুধু মালিক পাঠানো বার্তা দেখতে পারেন।", onlyOwnerAudit: "শুধু মালিক অডিট ট্রেইল দেখতে পারেন।",
    noOutbox: "এখনো কোনো বার্তা পাঠানো হয়নি। অনুমোদিত রিমাইন্ডার ও অনুরোধ এখানে দেখা যাবে (স্যান্ডবক্স, আসল এসএমএস নয়)।",
    chainOk: "হ্যাশ চেইন যাচাই হয়েছে: {n}টি এন্ট্রি, কোনো কারচুপি নেই।", chainBad: "হ্যাশ চেইন ভাঙা, এন্ট্রি {n}।",
    lenderTitle: "আপনার সাথে শেয়ার করা রিপোর্ট", lenderNote: "ব্যবসার মালিক যা শেয়ার করার অনুমোদন দিয়েছেন, শুধু সেটাই দেখতে পাবেন।",
    noReports: "এখনো কোনো রিপোর্ট শেয়ার করা হয়নি।", shared: "শেয়ার করা হয়েছে", figure: "বিষয়", value: "মান",
    k_avgSales: "গড় মাসিক বিক্রি", k_margin: "মোট লাভের হার (আনুমানিক)", k_opcash: "মাসিক পরিচালন নগদ প্রবাহ",
    k_debt: "বর্তমান মাসিক কিস্তি", k_overdue: "বকেয়া পাওনা", k_payables: "পরিশোধযোগ্য বিল",
    k_inject: "মালিক বাইরে থেকে দিয়েছেন (৫২ সপ্তাহ)", k_injectVal: "{n} সপ্তাহে {a}",
    peerLine: "তুলনা: {n}টি অনুরূপ দোকানের প্রায় {p}% এর চেয়ে ভালো (নাম-গোপন)।",
    updated: "নতুন তথ্য দিয়ে হালনাগাদ হয়েছে।", error: "সমস্যা",
    t_critical: "সামনে নগদ টাকার ঘাটতি", t_warning: "নগদ টাকা টানাটানি হচ্ছে", t_healthy: "নগদ প্রবাহ ভালো আছে",
    a_healthy: "আগামী ৮ সপ্তাহে সর্বনিম্ন প্রত্যাশিত নগদ: {a}।",
    a_below: "{d} সপ্তাহে নগদ {what} নিচে নামতে পারে; সর্বনিম্ন {a}, {d2} সপ্তাহে।",
    zero: "শূন্যের", buffer: "নিরাপত্তা মজুতের",
    kp_cash: "হাতে নগদ", kp_runway: "প্রায় {n} সপ্তাহ চলবে", kp_sales: "বিক্রি, গত ১২ সপ্তাহ", kp_yoy: "গত বছরের তুলনায় {p}",
    kp_margin: "মোট লাভের হার", kp_marginSub: "মাল কেনার হিসাব থেকে অনুমান", kp_be: "লাভ-ক্ষতি সমান বিক্রি", kp_month: "প্রতি মাসে",
    kp_dscr: "ঋণ পরিশোধ সক্ষমতা (DSCR)", kp_inst: "কিস্তি {a}/মাস", kp_overdue: "বকেয়া বাকি", kp_cust: "{n} জন ক্রেতা",
    role_owner: "মালিক", role_accountant: "হিসাবরক্ষক", role_lender: "ঋণদাতা",
    st_open: "খোলা", st_paid: "পরিশোধিত", st_extension_requested: "সময় চাওয়া হয়েছে", st_pending_approval: "অনুমোদনের অপেক্ষায়",
    st_approved: "অনুমোদিত", st_rejected: "বাতিল", st_expired: "মেয়াদ শেষ", st_stale: "বাতিল (তথ্য বদলেছে)",
    st_blocked: "আটকানো", st_denied: "অনুমতি নেই", st_executed: "সম্পন্ন", st_drafted: "খসড়া",
    st_strong: "ভালো", st_average: "মাঝারি", st_attention: "নজর দিন",
    chips: { second: ["দ্বিতীয় দোকান?", "নতুন দোকান খুললে কী হবে?"], drop: ["বিক্রি 20% কমলে?", "বিক্রি 20% কমলে কী হবে?"],
      compare: ["তুলনা", "অন্য দোকানের তুলনায় আমার লাভ কেমন?"], finance: ["ঋণের বিকল্প", "ঋণের বিকল্প খুঁজুন"],
      transfer: ["টাকা ট্রান্সফার", "নূর ফেব্রিক্সে এখনই 50000 টাকা ট্রান্সফার করো"], cash: ["ক্যাশের অবস্থা", "আমার ক্যাশের অবস্থা কেমন?"] },
    monthsShort: ["জানু", "ফেব্রু", "মার্চ", "এপ্রি", "মে", "জুন", "জুলাই", "আগ", "সেপ্টে", "অক্টো", "নভে", "ডিসে"],
    months: ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"],
  },
};

function t(key, vars = {}) {
  let s = (STR[state.lang] && STR[state.lang][key]) ?? STR.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.split("{" + k + "}").join(String(v));
  return s;
}
const st = (s) => t("st_" + s) === "st_" + s ? s : t("st_" + s);

function applyStaticText() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = t(n.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach((n) => { n.placeholder = t(n.dataset.i18nPh); });
  document.querySelectorAll("[data-i18n-title]").forEach((n) => { n.title = t(n.dataset.i18nTitle); });
  document.querySelectorAll("[data-chip]").forEach((b) => { const c = STR[state.lang].chips[b.dataset.chip]; b.textContent = c[0]; b.dataset.q = c[1]; });
  $("synthBanner").textContent = t("synth");
  $("langBtn").textContent = state.lang === "en" ? "বাংলা" : "English";
  if (state.role) $("roleBadge").textContent = t("role_" + state.role);
}

// ------------------------------------------------------------------ helpers
function el(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "style") n.style.cssText = v;   // CSSOM is allowed by our CSP; style attributes are not
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    n.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  }
  return n;
}

function bdt(x) {
  if (x === null || x === undefined || isNaN(x)) return "—";
  const neg = x < 0; let s = String(Math.round(Math.abs(x)));
  if (s.length > 3) {
    let head = s.slice(0, -3); const tail = s.slice(-3); const g = [];
    while (head.length > 2) { g.unshift(head.slice(-2)); head = head.slice(0, -2); }
    if (head) g.unshift(head);
    s = g.join(",") + "," + tail;
  }
  return (neg ? "-" : "") + "৳" + s;
}
const pct = (x) => (x === null || x === undefined ? "—" : (x * 100).toFixed(0) + "%");
function fdate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${t("months")[m - 1]} ${y}`;
}
const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const qs = () => "lang=" + state.lang;

let toastTimer = null;
function toast(msg, bad = false) {
  const n = $("toast"); n.textContent = msg; n.classList.remove("hidden"); n.style.background = bad ? "#b42318" : "";
  clearTimeout(toastTimer); toastTimer = setTimeout(() => n.classList.add("hidden"), 4500);
}
function flash(id) { const n = $(id); if (!n) return; n.classList.remove("flash"); void n.offsetWidth; n.classList.add("flash"); }

const SERVER_BN = [
  [/^Not sent: That customer due is already closed/, "পাঠানো হয়নি: এই বাকি এর মধ্যেই পরিশোধ হয়ে গেছে। নতুন তথ্য দিয়ে এজেন্টকে আবার জিজ্ঞেস করুন।"],
  [/^Not sent: The underlying record changed/, "পাঠানো হয়নি: অনুরোধ তৈরির পর তথ্য বদলে গেছে। নতুন তথ্য দিয়ে এজেন্টকে আবার জিজ্ঞেস করুন।"],
  [/^Not sent:/, "পাঠানো হয়নি: তথ্য বদলে গেছে। এজেন্টকে আবার জিজ্ঞেস করুন।"],
  [/^Action is .*not pending|^Action was already decided/, "এই কাজটির সিদ্ধান্ত আগেই হয়ে গেছে।"],
  [/^This request expired/, "অনুরোধের মেয়াদ শেষ। এজেন্টকে আবার জিজ্ঞেস করুন।"],
  [/^Past weeks cannot be overwritten/, "আগের সপ্তাহ বদলানো যায় না; শুধু নতুন সপ্তাহ যোগ করা যায়।"],
  [/^Invalid username or password/, "ইউজারনেম বা পাসওয়ার্ড ভুল।"],
  [/^Your role/, "আপনার ভূমিকায় এই কাজের অনুমতি নেই।"],
];
function serverMsg(m) {
  if (state.lang !== "bn") return m;
  for (const [rx, bn] of SERVER_BN) if (rx.test(m)) return bn;
  return m;
}

async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json" };
  if (state.token) headers["Authorization"] = "Bearer " + state.token;
  const res = await fetch(path, { method: opts.method || "GET", headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && state.token) { logout(); throw new Error("Session expired"); }
  if (!res.ok) throw new Error(serverMsg(data.error || ("HTTP " + res.status)));
  return data;
}
async function busy(fn) { state.busy++; try { return await fn(); } finally { state.busy--; } }

// ------------------------------------------------------------------ start-up, login, language
try { const l = localStorage.getItem("hishab_lang"); if (l === "en" || l === "bn") state.lang = l; } catch (e) { /* storage blocked */ }
$("loginView").classList.remove("hidden");
applyStaticText();

document.querySelectorAll(".demo-users button").forEach((b) =>
  b.addEventListener("click", () => { $("username").value = b.dataset.u; $("password").value = b.dataset.p; }));

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("loginError").textContent = "";
  try {
    const r = await api("/api/login", { method: "POST", body: { username: $("username").value, password: $("password").value } });
    state.token = r.token; state.user = r.user;
    const m = r.memberships[0];
    if (!m) throw new Error("This account is not linked to any business.");
    state.bid = m.business_id; state.role = m.role;
    $("bizName").textContent = m.role === "lender" ? r.user.full_name : m.name;
    ["bizName", "roleBadge", "logoutBtn"].forEach((id) => $(id).classList.remove("hidden"));
    $("loginView").classList.add("hidden");
    $("password").value = "";
    applyStaticText();
    if (m.role === "lender") { $("lenderView").classList.remove("hidden"); loadLender(); }
    else { $("appView").classList.remove("hidden"); await startApp(); }
  } catch (err) { $("loginError").textContent = err.message; }
});

async function logout() {
  try { if (state.token) await fetch("/api/logout", { method: "POST", headers: { Authorization: "Bearer " + state.token } }); } catch (e) { /* ignore */ }
  location.reload();
}
$("logoutBtn").addEventListener("click", logout);

$("langBtn").addEventListener("click", async () => {
  state.lang = state.lang === "en" ? "bn" : "en";
  try { localStorage.setItem("hishab_lang", state.lang); } catch (e) { /* storage blocked */ }
  applyStaticText();
  if (!state.token) return;
  if (state.role === "lender") return loadLender();
  await refreshAll();
  if (state.checked) runCheck(true); else $("briefing").textContent = t("briefingEmpty");
  if (state.finQuery) loadFinancing(state.finQuery);
  runScenario();
});

// ------------------------------------------------------------------ dashboard (re-read on every change)
async function startApp() {
  $("briefing").textContent = t("briefingEmpty");
  $("financing").replaceChildren(el("p", { class: "muted" }, t("finEmpty")));
  if (state.role !== "owner" && state.role !== "accountant") $("entryCard").classList.add("hidden");
  await refreshAll();
  runScenario();
  $("liveDot").classList.remove("hidden");
  setInterval(poll, 8000);
}

async function refreshAll() {
  return busy(async () => {
    const b = `/api/businesses/${state.bid}`;
    const [sum, hist, fc, cash] = await Promise.all([api(`${b}/summary`), api(`${b}/history`), api(`${b}/forecast`), api(`${b}/cash`)]);
    state.cash = cash; state.summary = sum.summary; state.last = hist.last_record;
    renderKpis(sum.summary);
    renderAlert(cash);
    drawSales(hist.weeks.slice(-26), fc);
    drawCash(cash, state.plan);
    $("forecastNote").textContent = t("forecastNote", { m: fc.method });
    prefillWeek();
    await Promise.all([refreshPending(), showTab(state.tab), loadBenchmark()]);
    const v = await api(`${b}/version`); state.version = v.version;
  });
}

async function poll() {
  if (!state.token || state.busy || document.hidden) return;
  try {
    const v = await api(`/api/businesses/${state.bid}/version`);
    if (state.version !== null && v.version !== state.version) {
      state.plan = null;           // the data changed, so an earlier plan line may be out of date
      await refreshAll(); toast(t("updated")); ["kpis", "alertBox"].forEach(flash);
    }
  } catch (e) { /* offline for a moment; try again next time */ }
}

async function afterChange(msg) {
  state.plan = null;
  await refreshAll();
  if (msg) toast(msg);
  ["kpis", "alertBox", "cashChart"].forEach(flash);
  runScenario();
}

async function loadBenchmark() {
  const box = $("benchmark");
  try {
    const b = await api(`/api/businesses/${state.bid}/benchmark?${qs()}`);
    if (!b.available) { $("benchNote").textContent = ""; box.replaceChildren(el("p", { class: "muted" }, b.message)); return; }
    $("benchNote").textContent = `${b.privacy} ${t("benchOverall", { p: b.overall_percentile })} ${b.data_note}`;
    const rows = b.metrics.filter((m) => m.available).map((m) => el("tr", {},
      el("td", {}, m.label, m.tip ? el("div", { class: "tip" }, "→ " + m.tip) : ""),
      el("td", { class: "num" }, m.you_display), el("td", { class: "num" }, m.median_display),
      el("td", {}, el("div", { class: "rankbar " + m.status }, el("span", { style: `width:${m.percentile_rank}%` })),
        el("div", { class: "muted small" }, t("betterThan", { p: m.percentile_rank }))),
      el("td", {}, el("span", { class: "status " + m.status }, st(m.status)))));
    box.replaceChildren(el("table", {}, el("tr", {}, el("th", {}, t("measure")), el("th", { class: "num" }, t("you")),
      el("th", { class: "num" }, t("peerMedian")), el("th", {}, t("rank")), el("th", {}, "")), rows));
  } catch (e) { box.textContent = t("error") + ": " + e.message; }
}

function renderKpis(s) {
  const yoy = s.sales_growth_yoy_12w === null ? "—" : (s.sales_growth_yoy_12w * 100).toFixed(1) + "%";
  const k = [
    [t("kp_cash"), bdt(s.cash_balance), t("kp_runway", { n: s.cash_runway_weeks ?? "—" })],
    [t("kp_sales"), bdt(s.sales_last_12_weeks), t("kp_yoy", { p: yoy })],
    [t("kp_margin"), pct(s.gross_margin_estimate), t("kp_marginSub")],
    [t("kp_be"), bdt(s.break_even_monthly_sales), t("kp_month")],
    [t("kp_dscr"), s.dscr ?? "—", t("kp_inst", { a: bdt(s.debt_service_monthly) })],
    [t("kp_overdue"), bdt(s.receivables_overdue), t("kp_cust", { n: s.overdue_customers })],
  ];
  $("kpis").replaceChildren(...k.map(([l, v, sub]) =>
    el("div", { class: "kpi" }, el("div", { class: "label" }, l), el("div", { class: "value" }, v), el("div", { class: "sub" }, sub))));
}

function renderAlert(cash) {
  const e = cash.expected, lvl = cash.alert_level;
  $("alertBox").className = "alert " + lvl;
  $("alertTitle").textContent = t("t_" + lvl);
  const wk = e.first_negative_week || e.first_below_buffer_week;
  $("alertText").textContent = lvl === "healthy" || !wk
    ? t("a_healthy", { a: bdt(e.min_cash) })
    : t("a_below", { what: lvl === "critical" ? t("zero") : t("buffer"), d: fdate(e.weeks[wk - 1].week_start),
        a: bdt(e.min_cash), d2: fdate(e.weeks[e.min_cash_week - 1].week_start) });
}

// ------------------------------------------------------------------ SVG charts
const NS = "http://www.w3.org/2000/svg";
function svg(tag, attrs) { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; }

function chartFrame(container, xs, yMin, yMax) {
  const W = 560, H = 250, L = 56, R = 12, T = 12, B = 30;
  const root = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img" });
  const sx = (i) => L + (i * (W - L - R)) / Math.max(xs.length - 1, 1);
  const sy = (v) => T + ((yMax - v) * (H - T - B)) / (yMax - yMin || 1);
  for (let k = 0; k <= 4; k++) {
    const v = yMin + ((yMax - yMin) * k) / 4, y = sy(v);
    root.appendChild(svg("line", { x1: L, x2: W - R, y1: y, y2: y, stroke: "#e5ebe6" }));
    const tx = svg("text", { x: L - 6, y: y + 4, "text-anchor": "end" });
    tx.textContent = Math.abs(v) >= 1e5 ? (v / 1e5).toFixed(1) + "L" : Math.round(v / 1e3) + "k"; root.appendChild(tx);
  }
  const step = Math.ceil(xs.length / 6);
  xs.forEach((d, i) => { if (i % step === 0 || (i === xs.length - 1 && i % step > step / 2)) {
    const tx = svg("text", { x: sx(i), y: H - 10, "text-anchor": "middle" }); const [, m, dd] = d.split("-").map(Number);
    tx.textContent = `${dd} ${t("monthsShort")[m - 1]}`; root.appendChild(tx); } });
  container.replaceChildren(root);
  return { root, sx, sy };
}
const path = (pts) => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");

function drawSales(hist, fc) {
  const xs = hist.map((w) => w.week_start).concat(fc.weeks.map((w) => w.week_start));
  const vals = hist.map((w) => w.sales).concat(fc.weeks.map((w) => w.high));
  const { root, sx, sy } = chartFrame($("salesChart"), xs, 0, Math.max(...vals) * 1.08);
  const n = hist.length;
  const band = fc.weeks.map((w, i) => [sx(n + i), sy(w.high)]).concat(fc.weeks.map((w, i) => [sx(n + i), sy(w.low)]).reverse());
  root.appendChild(svg("path", { d: path(band) + " Z", fill: "#cfe3f6" }));
  root.appendChild(svg("path", { d: path(hist.map((w, i) => [sx(i), sy(w.sales)])), fill: "none", stroke: "#1b2a24", "stroke-width": 2 }));
  root.appendChild(svg("path", { d: path([[sx(n - 1), sy(hist[n - 1].sales)]].concat(fc.weeks.map((w, i) => [sx(n + i), sy(w.p50)]))),
    fill: "none", stroke: "#1f5fa8", "stroke-width": 2, "stroke-dasharray": "5 4" }));
}

function drawCash(cash, after) {
  const e = cash.expected, p = cash.pessimistic;
  const xs = e.weeks.map((w) => w.week_start);
  const all = e.weeks.map((w) => w.closing_cash).concat(p.weeks.map((w) => w.closing_cash), [e.safety_buffer, 0, e.starting_cash]);
  if (after) all.push(...after.map((w) => w.closing_cash));
  const lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo) * 0.08;
  const { root, sx, sy } = chartFrame($("cashChart"), xs, lo - pad, hi + pad);
  root.appendChild(svg("line", { x1: sx(0), x2: sx(xs.length - 1), y1: sy(0), y2: sy(0), stroke: "#b42318", "stroke-width": 1 }));
  root.appendChild(svg("line", { x1: sx(0), x2: sx(xs.length - 1), y1: sy(e.safety_buffer), y2: sy(e.safety_buffer), stroke: "#a15c07", "stroke-dasharray": "4 4" }));
  root.appendChild(svg("path", { d: path(p.weeks.map((w, i) => [sx(i), sy(w.closing_cash)])), fill: "none", stroke: "#c98b8b", "stroke-width": 1.5, "stroke-dasharray": "3 3" }));
  root.appendChild(svg("path", { d: path(e.weeks.map((w, i) => [sx(i), sy(w.closing_cash)])), fill: "none", stroke: "#1b2a24", "stroke-width": 2 }));
  if (after) root.appendChild(svg("path", { d: path(after.map((w, i) => [sx(i), sy(w.closing_cash)])), fill: "none", stroke: "#127a3a", "stroke-width": 2.5 }));
  const legend = [["#1b2a24", t("legendExpected")], ["#c98b8b", t("legendWeak")], ["#127a3a", after ? t("legendAfter") : null]];
  legend.filter((l) => l[1]).forEach(([c, tx], i) => {
    root.appendChild(svg("rect", { x: 64 + i * 140, y: 16, width: 12, height: 3, fill: c }));
    const n = svg("text", { x: 80 + i * 140, y: 20 }); n.textContent = tx; root.appendChild(n);
  });
}

// ------------------------------------------------------------------ data entry
document.querySelectorAll("#entryTabs button").forEach((b) => b.addEventListener("click", () => {
  state.entry = b.dataset.entry;
  document.querySelectorAll("#entryTabs button").forEach((x) => x.classList.toggle("active", x === b));
  $("weekForm").classList.toggle("hidden", state.entry !== "week");
  $("dueForm").classList.toggle("hidden", state.entry !== "due");
  $("billForm").classList.toggle("hidden", state.entry !== "bill");
  $("entryMsg").textContent = "";
}));

const WEEK_FIELDS = ["sales", "credit_sales", "receivables_collected", "stock_purchases", "rent", "salaries", "utilities",
  "other_expenses", "loan_repayment", "owner_drawings"];

function prefillWeek() {
  const r = state.last; if (!r) return;
  const f = $("weekForm");
  const nextWeek = addDays(r.week_start, 7);
  $("weekStart").textContent = fdate(nextWeek);
  if (f.dataset.week === nextWeek) { updateClosing(); return; }   // keep what the user is typing
  f.dataset.week = nextWeek;
  for (const k of WEEK_FIELDS) f.elements[k].value = Math.round(r[k] || 0);
  // rent and salaries are paid once a month: pre-fill them only if the new week starts a month
  if (Number(nextWeek.slice(8, 10)) > 7) { f.elements.rent.value = 0; f.elements.salaries.value = 0; }
  updateClosing();
}

function weekValues() {
  const f = $("weekForm"), v = {};
  for (const k of WEEK_FIELDS) v[k] = Math.max(0, Number(f.elements[k].value || 0));
  v.cash_sales = v.sales - v.credit_sales;
  v.closing = (state.summary ? state.summary.cash_balance : 0) + v.cash_sales + v.receivables_collected - v.stock_purchases
    - v.rent - v.salaries - v.utilities - v.other_expenses - v.loan_repayment - v.owner_drawings;
  return v;
}
function updateClosing() { $("closingCash").textContent = bdt(weekValues().closing); }
$("weekForm").addEventListener("input", updateClosing);

$("weekForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const v = weekValues();
  if (v.credit_sales > v.sales) { toast(t("creditTooHigh"), true); return; }
  const week = $("weekForm").dataset.week;
  const body = { week_start: week, sales: v.sales, cash_sales: v.cash_sales, credit_sales: v.credit_sales,
    receivables_collected: v.receivables_collected, stock_purchases: v.stock_purchases, rent: v.rent, salaries: v.salaries,
    festival_bonus: 0, utilities: v.utilities, other_expenses: v.other_expenses, loan_repayment: v.loan_repayment,
    owner_drawings: v.owner_drawings, owner_injection: 0, cash_balance: Math.round(v.closing) };
  await submitEntry(`/api/businesses/${state.bid}/records`, body, t("savedWeek", { d: fdate(week) }));
});

$("dueForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const ok = await submitEntry(`/api/businesses/${state.bid}/receivables`, { customer_name: f.elements.customer_name.value,
    customer_phone: f.elements.customer_phone.value, amount: Number(f.elements.amount.value), due_date: f.elements.due_date.value,
    note: f.elements.note.value }, t("savedDue"));
  if (ok) { f.reset(); showTab("dues"); }
});

$("billForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const ok = await submitEntry(`/api/businesses/${state.bid}/payables`, { counterparty: f.elements.counterparty.value,
    description: f.elements.description.value, amount: Number(f.elements.amount.value), due_date: f.elements.due_date.value,
    category: f.elements.category.value, flexible: f.elements.flexible.checked }, t("savedBill"));
  if (ok) { f.reset(); showTab("bills"); }
});

async function submitEntry(url, body, okMsg) {
  if (state.role !== "owner" && state.role !== "accountant") { toast(t("readOnlyEntry"), true); return false; }
  try {
    await busy(() => api(url, { method: "POST", body }));
    $("entryMsg").textContent = okMsg; $("entryMsg").className = "small ok";
    await afterChange(okMsg);
    return true;
  } catch (err) { $("entryMsg").textContent = err.message; $("entryMsg").className = "small bad"; return false; }
}

async function markPaid(kind, id, amount) {
  try {
    await busy(() => api(`/api/businesses/${state.bid}/${kind}/${id}/paid`, { method: "POST" }));
    await afterChange(t(kind === "receivables" ? "paidDue" : "paidBill", { a: bdt(amount) }));
  } catch (err) { toast(err.message, true); }
}

async function askReminder(rid) {
  try {
    const r = await busy(() => api(`/api/businesses/${state.bid}/agent/tool`, { method: "POST",
      body: { tool: "send_payment_reminder", params: { receivable_id: rid, language: state.lang } } }));
    if (r.status === "pending_approval") toast(t("remindQueued")); else toast(r.message || r.error || st(r.status), r.status !== "executed");
    await refreshPending(); flash("pending");
  } catch (err) { toast(err.message, true); }
}

// ------------------------------------------------------------------ agent
$("checkBtn").addEventListener("click", () => runCheck(false));

async function runCheck(quiet) {
  const b = $("checkBtn"); b.disabled = true; b.textContent = t("analysing");
  try {
    const r = await busy(() => api(`/api/businesses/${state.bid}/agent/check`, { method: "POST", body: { language: state.lang } }));
    state.checked = true;
    $("briefing").textContent = r.briefing;
    state.plan = r.plan ? r.plan.projection_after : null;
    drawCash(state.cash, state.plan);
    if (r.financing) { renderFinancing(r.financing); state.finQuery = { amount: r.financing.need_amount, by: r.financing.needed_by, supplier: 0 }; }
    await refreshPending(); if (state.tab === "actions") showTab("actions");
    const v = await api(`/api/businesses/${state.bid}/version`); state.version = v.version;
    if (!quiet) flash("briefing");
  } catch (e) { $("briefing").textContent = t("error") + ": " + e.message; }
  b.disabled = false; b.textContent = t("runCheck");
}

async function refreshPending() {
  const r = await api(`/api/businesses/${state.bid}/actions?status=pending_approval&${qs()}`);
  const box = $("pending");
  if (!r.actions.length) { box.replaceChildren(el("p", { class: "muted" }, t("nothingPending"))); return; }
  box.replaceChildren(...r.actions.map((a) => {
    const btns = state.role === "owner"
      ? el("div", { class: "btns" },
          el("button", { class: "primary", onclick: () => decide(a.id, "approve") }, t("approve")),
          el("button", { onclick: () => decide(a.id, "reject") }, t("reject")))
      : el("span", { class: "muted small" }, t("ownerNeeded"));
    return el("div", { class: "pending-item" },
      el("div", {}, el("span", { class: "tag t2" }, t("tier") + " 2"), " ", a.summary,
        el("div", { class: "msg" }, (a.preview && a.preview.message) ? t("message") + ": " + a.preview.message : "")), btns);
  }));
}

async function decide(id, verb) {
  try {
    await busy(() => api(`/api/actions/${id}/${verb}`, { method: "POST" }));
    toast(t(verb === "approve" ? "approved" : "rejected"));
  } catch (e) { toast(e.message, true); }
  await refreshAll();
}

$("chatForm").addEventListener("submit", (e) => { e.preventDefault(); sendChat($("chatInput").value); });
document.querySelectorAll(".chips button").forEach((b) => b.addEventListener("click", () => sendChat(b.dataset.q)));

async function sendChat(text) {
  if (!text.trim()) return;
  $("chatInput").value = "";
  const log = $("chatLog");
  log.appendChild(el("div", { class: "bubble me" }, text));
  const wait = el("div", { class: "bubble ai" }, "…"); log.appendChild(wait); log.scrollTop = log.scrollHeight;
  try {
    const r = await busy(() => api(`/api/businesses/${state.bid}/agent/chat`, { method: "POST", body: { message: text, language: state.lang } }));
    const tools = (r.tool_calls || []).map((x) => `${x.tool} → ${st(x.status)}`).join(" · ");
    wait.replaceChildren(document.createTextNode(r.reply), tools ? el("div", { class: "tools" }, t("tools") + ": " + tools) : "");
    if (r.data && r.data.options) { renderFinancing(r.data); state.finQuery = { amount: r.data.need_amount, by: r.data.needed_by, supplier: 1 }; }
    await refreshPending();
  } catch (e) { wait.textContent = t("error") + ": " + e.message; }
  log.scrollTop = log.scrollHeight;
}

// ------------------------------------------------------------------ what-if (live) + financing
const PRESETS = {
  shop2: { sales_change_pct: 25, purchase_cost_change_pct: 0, extra_monthly_fixed: 75000, one_time_cost: 600000, loan_amount: 0, loan_rate: 9, loan_months: 24 },
  drop: { sales_change_pct: -20, purchase_cost_change_pct: 0, extra_monthly_fixed: 0, one_time_cost: 0, loan_amount: 0, loan_rate: 9, loan_months: 24 },
  reset: { sales_change_pct: 0, purchase_cost_change_pct: 0, extra_monthly_fixed: 0, one_time_cost: 0, loan_amount: 0, loan_rate: 9, loan_months: 24 },
};
document.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => {
  const p = PRESETS[b.dataset.preset], f = $("scenarioForm");
  for (const [k, v] of Object.entries(p)) f.elements[k].value = v;
  runScenario();
}));
let scenarioTimer = null;
$("scenarioForm").addEventListener("input", () => { clearTimeout(scenarioTimer); scenarioTimer = setTimeout(runScenario, 400); });
$("scenarioForm").addEventListener("submit", (e) => { e.preventDefault(); runScenario(); });

async function runScenario() {
  if (!state.token || state.role === "lender") return;
  const f = $("scenarioForm"), n = (k) => Number(f.elements[k].value || 0);
  const body = { sales_change_pct: n("sales_change_pct"), purchase_cost_change_pct: n("purchase_cost_change_pct"),
    extra_monthly_fixed: n("extra_monthly_fixed"), one_time_cost: n("one_time_cost"), loan_amount: n("loan_amount"),
    loan_annual_rate: n("loan_rate") / 100, loan_months: Math.max(1, Math.round(n("loan_months"))) };
  try {
    const r = await api(`/api/businesses/${state.bid}/scenario`, { method: "POST", body });
    $("scenarioOut").replaceChildren(el("table", {},
      el("tr", {}, el("th", {}, ""), el("th", { class: "num" }, t("now")), el("th", { class: "num" }, t("scenario"))),
      el("tr", {}, el("td", {}, t("lowestCash")), el("td", { class: "num" }, bdt(r.baseline_min_cash)), el("td", { class: "num" }, bdt(r.scenario_min_cash))),
      el("tr", {}, el("td", {}, t("monthlyProfit")), el("td", { class: "num" }, bdt(r.baseline_monthly_profit)), el("td", { class: "num" }, bdt(r.scenario_monthly_profit))),
      el("tr", {}, el("td", {}, t("newInstalment")), el("td", { class: "num" }, "—"), el("td", { class: "num" }, bdt(r.new_loan_monthly_instalment)))),
      el("p", { class: "verdict " + (r.affordable ? "ok" : "bad") }, r.affordable ? t("affordable") : t("notAffordable")));
  } catch (err) { $("scenarioOut").textContent = t("error") + ": " + err.message; }
}

async function loadFinancing(q) {
  try {
    const p = new URLSearchParams({ amount: q.amount, lang: state.lang, supplier: q.supplier ?? 1 });
    if (q.by) p.set("by", q.by);
    renderFinancing(await api(`/api/businesses/${state.bid}/financing?${p}`));
  } catch (e) { $("financing").textContent = t("error") + ": " + e.message; }
}

function renderFinancing(fin) {
  const rows = fin.options.map((o) => el("tr", {},
    el("td", {}, o.name, el("div", { class: "muted small" }, (o.eligible ? o.why_eligible : o.why_not).join("; "))),
    el("td", {}, o.eligible ? (o.fast_enough ? el("span", { class: "ok" }, t("likelyEligible")) : el("span", { class: "muted" }, t("eligibleSlow")))
      : el("span", { class: "bad" }, t("notEligible"))),
    el("td", { class: "num" }, o.provider_type === "supplier" ? "—" : bdt(o.monthly_instalment)),
    el("td", {}, o.indicative_rate), el("td", { class: "num" }, t("days", { n: o.processing_days }))));
  $("financing").replaceChildren(
    el("p", { class: "small" }, t("need", { a: bdt(fin.need_amount) }) + (fin.needed_by ? t("needBy", { d: fdate(fin.needed_by) }) : "")),
    el("table", {}, el("tr", {}, el("th", {}, t("option")), el("th", {}, t("status")), el("th", { class: "num" }, t("monthly")),
      el("th", {}, t("rate")), el("th", { class: "num" }, t("estDays"))), rows),
    el("p", { class: "muted small" }, fin.disclaimer));
}

// ------------------------------------------------------------------ tabs
document.querySelectorAll("#mainTabs button").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));
const canEdit = () => state.role === "owner" || state.role === "accountant";

async function showTab(tab) {
  state.tab = tab;
  document.querySelectorAll("#mainTabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  const body = $("tabBody"), B = `/api/businesses/${state.bid}`;
  try {
    if (tab === "dues") {
      const r = await api(`${B}/receivables`);
      body.replaceChildren(table([t("customer"), t("amount"), t("due"), t("status"), t("note"), ""], r.receivables.map((x) =>
        [x.customer_name, bdt(x.amount), fdate(x.due_date), st(x.status), el("span", { class: "note-untrusted" }, x.note || ""),
          x.status === "open" && canEdit() ? el("div", { class: "btns" },
            el("button", { class: "mini", onclick: () => markPaid("receivables", x.id, x.amount) }, t("markPaid")),
            state.role === "owner" ? el("button", { class: "mini", onclick: () => askReminder(x.id) }, t("remind")) : null) : ""]), [1]));
    } else if (tab === "bills") {
      const r = await api(`${B}/payables`);
      body.replaceChildren(table([t("payTo"), t("for"), t("amount"), t("due"), t("flexible"), t("status"), ""], r.payables.map((x) =>
        [x.counterparty, x.description, bdt(x.amount), fdate(x.due_date), x.flexible ? t("yes") : t("no"), st(x.status),
          (x.status === "open" || x.status === "extension_requested") && canEdit()
            ? el("button", { class: "mini", onclick: () => markPaid("payables", x.id, x.amount) }, t("markPaid")) : ""]), [2]));
    } else if (tab === "outbox") {
      if (state.role !== "owner") { body.replaceChildren(el("p", { class: "muted" }, t("onlyOwnerOutbox"))); return; }
      const r = await api(`${B}/outbox`);
      body.replaceChildren(r.outbox.length ? table([t("time"), t("channel"), t("to"), t("message")], r.outbox.map((x) => [x.created_at, x.channel, x.recipient, x.message]))
        : el("p", { class: "muted" }, t("noOutbox")));
    } else if (tab === "actions") {
      const r = await api(`${B}/actions?${qs()}`);
      body.replaceChildren(table(["#", t("tool"), t("tier"), t("status"), t("time")], r.actions.map((a) =>
        [String(a.id), a.tool, el("span", { class: "tag t" + a.tier }, t("tier") + " " + a.tier), st(a.status), a.created_at])));
    } else if (tab === "audit") {
      if (state.role !== "owner") { body.replaceChildren(el("p", { class: "muted" }, t("onlyOwnerAudit"))); return; }
      const r = await api(`${B}/audit`);
      body.replaceChildren(el("p", { class: r.chain.valid ? "ok" : "bad" },
        r.chain.valid ? t("chainOk", { n: r.chain.entries_checked }) : t("chainBad", { n: r.chain.broken_at_id })),
        table([t("timeUtc"), t("event"), t("detail")], r.entries.map((x) => [x.ts.slice(0, 19).replace("T", " "), x.event, x.detail_json.slice(0, 140)])));
    }
  } catch (e) { body.textContent = t("error") + ": " + e.message; }
}

function table(head, rows, numCols = []) {
  return el("table", {}, el("tr", {}, head.map((h, i) => el("th", { class: numCols.includes(i) ? "num" : "" }, h))),
    rows.map((r) => el("tr", {}, r.map((c, i) => el("td", { class: numCols.includes(i) ? "num" : "" }, c)))));
}

// ------------------------------------------------------------------ lender
async function loadLender() {
  const r = await api("/api/lender/reports");
  const box = $("lenderReports");
  if (!r.reports.length) { box.replaceChildren(el("p", { class: "muted" }, t("noReports"))); return; }
  box.replaceChildren(...r.reports.map((x) => {
    const k = x.report.key_figures;
    return el("div", { class: "report" }, el("h3", {}, `${x.business_name} — ${t("shared")} ${x.created_at}`),
      table([t("figure"), t("value")], [
        [t("k_avgSales"), bdt(k.avg_monthly_sales_12w)], [t("k_margin"), pct(k.gross_margin_estimate)],
        [t("k_opcash"), bdt(k.operating_cash_flow_monthly)], [t("k_debt"), bdt(k.debt_service_monthly)],
        ["DSCR", String(k.dscr)], [t("k_overdue"), bdt(k.receivables_overdue)], [t("k_payables"), bdt(k.payables_open)],
        [t("k_inject"), k.owner_cash_injection_weeks_52w === undefined ? bdt(k.owner_cash_injections_52w)
          : t("k_injectVal", { a: bdt(k.owner_cash_injections_52w), n: k.owner_cash_injection_weeks_52w })]]),
      x.report.peer_comparison && x.report.peer_comparison.available
        ? el("p", { class: "small" }, t("peerLine", { p: x.report.peer_comparison.overall_percentile, n: x.report.peer_comparison.peer_count }))
        : "",
      el("p", { class: "muted small" }, x.report.data_provenance + " " + x.report.limitations.join(" ")));
  }));
}

"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  BookOpen,
  DollarSign,
  Users,
  CreditCard,
  Grid,
  Shield,
  Activity,
  CheckCircle2,
  HelpCircle,
  Search,
  Printer,
  Calendar,
  Sparkles,
  Lock,
  ArrowRight,
  ChevronRight,
  TrendingDown,
  Clock
} from "lucide-react";
import { exportListToPDF } from "@/lib/pdfExport";

export default function SystemRulesGuidePage() {
  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState("2026-08");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");

  const rulesData = [
    {
      category: "FINANCIAL",
      title: "Total Revenue Calculation Logic",
      icon: DollarSign,
      badge: "Financial Core",
      color: "blue",
      summary: "How Total Revenue is calculated across all branches.",
      description: "Total Revenue represents the complete gross value of the library's operations for the selected billing period.",
      formula: "TOTAL REVENUE = RECEIVED REVENUE + UPCOMING RECEIVABLES",
      points: [
        "Received Revenue includes all actual collections (Cash + Online/UPI + Split).",
        "Upcoming Receivables include all unpaid balances, partial payment remainders, pay-later deferred amounts, and overdue renewals.",
        "Total Revenue gives a complete picture of total expected cash flow for the month."
      ]
    },
    {
      category: "FINANCIAL",
      title: "Received Revenue (Cash vs Online Split)",
      icon: CreditCard,
      badge: "Collections",
      color: "emerald",
      summary: "How money collected via Cash, UPI, and Split payments is segregated.",
      formula: "RECEIVED REVENUE = CASH REVENUE + ONLINE REVENUE",
      points: [
        "Cash Payments: Directly added to Cash Revenue ledger.",
        "Online / UPI / Card Payments: Directly added to Online Revenue ledger.",
        "Split Payments: System automatically splits cash part to Cash Ledger and online part to UPI Ledger based on entry.",
        "Today's Live Feed: Shows real-time counter collections for today."
      ]
    },
    {
      category: "FINANCIAL",
      title: "Upcoming Receivables & Dues Count",
      icon: Clock,
      badge: "Dues & PayLater",
      color: "amber",
      summary: "Which students and dues are counted in the UPCOMING tile.",
      formula: "UPCOMING = SUM(outstanding_dues) + SUM(PayLater Deferred Amounts) + SUM(Overdue Plan Amounts)",
      points: [
        "Partial Payments: Students who paid partial amount today and owe remaining dues.",
        "Pay Later (Deferred): New admissions or renewals with ₹0 paid today and an agreed due date.",
        "Overdue Defaulters: Active members whose subscription expired and renewal is pending.",
        "Dues Tracker Page: Provides direct SMS/WhatsApp reminders for all items in this count."
      ]
    },
    {
      category: "SUBSCRIPTIONS",
      title: "Smart Subscription Renewal Continuation",
      icon: Calendar,
      badge: "Renewal Logic",
      color: "indigo",
      summary: "How renewal start dates are calculated when extending active plans.",
      points: [
        "Active Student Renewal (e.g. Current Expiry 12/09/2026): When recording an advance renewal payment today, the system automatically sets the Plan Start Date to 12/09/2026.",
        "30-Day Extension: The new expiry date calculates seamlessly (+30 days) to 12/10/2026, ensuring no days are wasted from the previous plan.",
        "Expired Student Renewal: If a student's plan has already expired, the start date defaults to today's date.",
        "Manual Override: Admins can manually override the start or end date at any time using the date pickers."
      ]
    },
    {
      category: "SUBSCRIPTIONS",
      title: "Collect Dues vs Renewal Payment Modes",
      icon: CheckCircle2,
      badge: "Payment Types",
      color: "cyan",
      summary: "Differences between Full Payment, Partial Payment, Pay Later, and Collect Dues.",
      points: [
        "Full Payment (FULL): Complete fee paid for a new 30-day (or custom) subscription cycle.",
        "Partial Payment (PARTIAL): Part fee paid today, remaining balance saved in outstanding_dues with a due date.",
        "Pay Later (PAY_LATER): ₹0 paid today, plan activated, full fee logged as outstanding_dues.",
        "Collect Dues (COLLECT_DUES): Clearing past/current pending balance. Does NOT shift expiry date unless selected."
      ]
    },
    {
      category: "FACILITIES",
      title: "Dynamic Locker Facility Management",
      icon: Lock,
      badge: "Locker Rules",
      color: "rose",
      summary: "How locker add-ons and removals operate during payments.",
      points: [
        "Bi-Directional Toggle: Admins can enable (+Add Locker) or disable (-Remove Locker) directly from the Record Payment page.",
        "Auto Fee Adjustment: Net plan fee automatically adjusts (+₹200 when adding locker, -₹200 when removing locker).",
        "Status Persistence: Saving the payment instantly updates the member's profile (has_locker & locker_no).",
        "Audit Logging: Locker changes are logged in the Activity Log for audit compliance."
      ]
    },
    {
      category: "OPERATIONS",
      title: "Seat Allocation & Shift Management",
      icon: Grid,
      badge: "Seating",
      color: "purple",
      summary: "Rules for assigning, swapping, and releasing seats.",
      points: [
        "Seat Assignment: Seats are assigned during admission or updated from the Seat Map page.",
        "Occupancy Calculation: Occupancy Rate = (Occupied Seats / Total Branch Capacity) * 100.",
        "Student Marked Left: When a student leaves the library, their assigned seat is automatically released and marked Available.",
        "Shift Restrictions: Full Day, Half Day Morning, and Half Day Evening shifts can share seats across non-overlapping shifts."
      ]
    },
    {
      category: "SECURITY",
      title: "Role-Based Access Control (RBAC)",
      icon: Shield,
      badge: "Permissions",
      color: "slate",
      summary: "Difference between Master Admin Mode and Staff Desk Mode.",
      points: [
        "Master Admin Mode: Full access to all financial analytics, revenue totals, expenses, activity logs, loss settlements, and system settings.",
        "Staff Desk Mode: Restricted operational view for library staff (Student directory, admissions, payment recording, seating, dues). Sensitive revenue totals and expense details are hidden.",
        "Session Persistence: Login credentials and roles persist securely in local session state."
      ]
    },
    {
      category: "OPERATIONS",
      title: "Left Members & Defaulter Loss Recovery",
      icon: TrendingDown,
      badge: "Defaulters",
      color: "red",
      summary: "How student departures and unpaid losses are tracked.",
      points: [
        "Normal Departure: Student leaves with 0 dues. Marked status = LEFT, seat vacated.",
        "Left with Dues (Defaulter): Student leaves without clearing dues. Dues transferred to Loss Payment ledger.",
        "Loss Recovery: If a defaulter returns later to clear their debt, the payment is recorded under Loss Payment Settlement and marked recovered in audit logs."
      ]
    }
  ];

  const categories = [
    { key: "ALL", label: "All System Rules" },
    { key: "FINANCIAL", label: "Financial & Revenue" },
    { key: "SUBSCRIPTIONS", label: "Subscriptions & Dates" },
    { key: "FACILITIES", label: "Lockers & Seats" },
    { key: "OPERATIONS", label: "Operations & Defaulters" },
    { key: "SECURITY", label: "Security & Permissions" }
  ];

  const filteredRules = rulesData.filter(rule => {
    const matchesCat = activeCategory === "ALL" || rule.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      rule.title.toLowerCase().includes(q) ||
      rule.summary.toLowerCase().includes(q) ||
      rule.points.some(p => p.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const handleExportGuidePDF = () => {
    const columns = ["Feature / Rule", "Description & Implementation Logic"];
    const rows = rulesData.map(r => [
      `${r.title} (${r.badge})`,
      `${r.summary}\nFormula: ${r.formula || 'N/A'}\n- ${r.points.join('\n- ')}`
    ]);

    exportListToPDF({
      title: "Mindspace Library Management System - Official Operations Manual & Rules SOP",
      columns,
      data: rows
    });
  };

  return (
    <DashboardLayout
      activeBranch={activeBranch}
      setActiveBranch={setActiveBranch}
      selectedMonth={selectedMonth}
      setSelectedMonth={setSelectedMonth}
    >
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                System Rules & Operations Guide (SOP)
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Complete reference manual explaining how financial metrics, subscription renewals, lockers, and seating workflows operate.
            </p>
          </div>

          <button
            onClick={handleExportGuidePDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>Export Manual PDF</span>
          </button>
        </div>

        {/* Quick Search & Category Filter Pills */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search rules (e.g. upcoming, total revenue, locker, renewal)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>

            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl">
              {filteredRules.length} System Rules Found
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeCategory === cat.key
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRules.map((rule, index) => {
            const Icon = rule.icon;

            return (
              <div
                key={index}
                className="bg-white border border-slate-200/80 hover:border-indigo-300 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                        {rule.title}
                      </h3>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border border-slate-200 shrink-0">
                      {rule.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {rule.summary}
                  </p>

                  {rule.formula && (
                    <div className="p-3 rounded-2xl bg-slate-900 text-cyan-300 font-mono text-[11px] font-bold border border-slate-800 tracking-tight">
                      💡 {rule.formula}
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      Key Operating Guidelines:
                    </p>
                    <ul className="space-y-1.5">
                      {rule.points.map((pt, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Category: {rule.category}</span>
                  <span className="text-indigo-600 font-bold flex items-center gap-1">
                    System Verified <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </DashboardLayout>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  PieChart as PieIcon,
  Calendar,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  ShieldAlert,
  Grid
} from "lucide-react";
import {
  fetchMembers,
  fetchPayments,
  fetchExpenses,
  formatDate
} from "@/lib/adminService";
import { exportListToPDF } from "@/lib/pdfExport";

export default function AnalyticsInsightsPage() {
  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); });
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    async function load() {
      const [mList, pList, eList] = await Promise.all([
        fetchMembers(activeBranch),
        fetchPayments(activeBranch),
        fetchExpenses(activeBranch)
      ]);
      setMembers(mList);
      setPayments(pList);
      setExpenses(eList);
    }
    load();
  }, [activeBranch]);

  // Selected Month Financials
  const monthPayments = payments.filter(p => p.paid_at && p.paid_at.substring(0, 7) === selectedMonth);
  const monthExpensesList = expenses.filter(e => e.expense_date && e.expense_date.substring(0, 7) === selectedMonth);

  const cashRevenue = monthPayments.reduce((sum, p) => {
    if (p.payment_mode === "Cash") return sum + parseFloat(p.amount || 0);
    if (p.payment_mode === "Split") return sum + parseFloat(p.cash_amount || 0);
    return sum;
  }, 0);

  const onlineRevenue = monthPayments.reduce((sum, p) => {
    if (p.payment_mode === "Split") return sum + parseFloat(p.online_amount || 0);
    if (["Online", "UPI", "Card"].includes(p.payment_mode) || (p.payment_mode && p.payment_mode !== "Cash" && p.payment_mode !== "Deferred")) {
      return sum + parseFloat(p.amount || 0);
    }
    return sum;
  }, 0);

  const totalRevenue = cashRevenue + onlineRevenue;

  const totalExpenseAmt = monthExpensesList.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const netIncome = totalRevenue - totalExpenseAmt;

  // Active Members Breakdown
  const activeMembers = members.filter(m => m.is_active && !m.left_at);
  const fullDayCount = activeMembers.filter(m => m.shift === "Full Day").length;
  const morningCount = activeMembers.filter(m => m.shift === "Morning").length;
  const eveningCount = activeMembers.filter(m => m.shift === "Evening").length;
  const totalShifts = Math.max(1, fullDayCount + morningCount + eveningCount);

  // Defaulter Risk Analysis (Members overdue or with dues)
  const overdueMembers = activeMembers.filter(m => new Date(m.subscription_end_date) < new Date());
  const riskDuesSum = overdueMembers.reduce((sum, m) => sum + parseFloat(m.plan_amount || 1100), 0);

  const handleExportPDF = () => {
    const columns = ["Analytics Metric", "Value"];
    const rows = [
      ["Total Received Revenue", `Rs. ${totalRevenue.toLocaleString()}`],
      ["Cash Collections", `Rs. ${cashRevenue.toLocaleString()}`],
      ["Online / UPI Collections", `Rs. ${onlineRevenue.toLocaleString()}`],
      ["Total Expenses", `Rs. ${totalExpenseAmt.toLocaleString()}`],
      ["Net Operating Profit", `Rs. ${netIncome.toLocaleString()}`],
      ["Full Day Occupancy", `${fullDayCount} students (${Math.round((fullDayCount / totalShifts) * 100)}%)`],
      ["Morning Shift Occupancy", `${morningCount} students (${Math.round((morningCount / totalShifts) * 100)}%)`],
      ["Evening Shift Occupancy", `${eveningCount} students (${Math.round((eveningCount / totalShifts) * 100)}%)`],
      ["Overdue At-Risk Revenue", `Rs. ${riskDuesSum.toLocaleString()}`]
    ];

    exportListToPDF({
      title: `In-Depth Executive Analytics & Insights (${selectedMonth})`,
      columns,
      data: rows
    });
  };

  return (
    <DashboardLayout activeBranch={activeBranch} setActiveBranch={setActiveBranch} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}>
      <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>In-Depth Analytics & Financial Forecasting</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Deep-dive metrics, cash vs online revenue splits, shift yield analytics, and defaulter risk forecasting
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Export Report (PDF)</span>
          </button>
        </div>

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">Total Collections</span>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">₹{totalRevenue.toLocaleString()}</p>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" /> Collected this month
            </span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">Total Expenses</span>
            <p className="text-2xl font-black text-rose-600 font-mono mt-1">₹{totalExpenseAmt.toLocaleString()}</p>
            <span className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5 mt-1">
              <ArrowDownRight className="w-3 h-3" /> {monthExpensesList.length} expense items
            </span>
          </div>

          <div className={`${netIncome >= 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-rose-50 border-rose-200'} border rounded-2xl p-5 shadow-2xs`}>
            <span className={`text-[10px] font-extrabold uppercase tracking-widest block ${netIncome >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>Net Operating Profit</span>
            <p className={`text-2xl font-black font-mono mt-1 ${netIncome >= 0 ? 'text-indigo-900' : 'text-rose-900'}`}>₹{netIncome.toLocaleString()}</p>
            <span className="text-[10px] font-bold text-slate-500 block mt-1">Revenue minus Expenses</span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">At-Risk Overdue Revenue</span>
            <p className="text-2xl font-black text-amber-600 font-mono mt-1">₹{riskDuesSum.toLocaleString()}</p>
            <span className="text-[10px] font-bold text-amber-700 block mt-1">{overdueMembers.length} students overdue</span>
          </div>
        </div>

        {/* Charts & Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Split: Cash vs Online */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-600" />
              <span>Payment Mode Revenue Split</span>
            </h3>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-emerald-700">Cash Collections</span>
                  <span className="font-mono text-slate-900">₹{cashRevenue.toLocaleString()} ({Math.round((cashRevenue / Math.max(1, totalRevenue)) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((cashRevenue / Math.max(1, totalRevenue)) * 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-indigo-700">Online & UPI Collections</span>
                  <span className="font-mono text-slate-900">₹{onlineRevenue.toLocaleString()} ({Math.round((onlineRevenue / Math.max(1, totalRevenue)) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((onlineRevenue / Math.max(1, totalRevenue)) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Shift Yield & Occupancy Breakdown */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Grid className="w-4 h-4 text-cyan-600" />
              <span>Shift Occupancy & Distribution</span>
            </h3>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-cyan-700">Full Day Access (24x7)</span>
                  <span className="font-mono text-slate-900">{fullDayCount} Students ({Math.round((fullDayCount / totalShifts) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((fullDayCount / totalShifts) * 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-amber-700">Morning Shift</span>
                  <span className="font-mono text-slate-900">{morningCount} Students ({Math.round((morningCount / totalShifts) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((morningCount / totalShifts) * 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-purple-700">Evening Shift</span>
                  <span className="font-mono text-slate-900">{eveningCount} Students ({Math.round((eveningCount / totalShifts) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((eveningCount / totalShifts) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Defaulter Risk Forecast Box */}
        <div className="bg-gradient-to-r from-amber-50 via-white to-orange-50 border border-amber-200 rounded-3xl p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Defaulter Risk Early Warning Engine</span>
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            Currently, <strong>{overdueMembers.length} active students</strong> have expired subscriptions with an estimated at-risk revenue of <strong>₹{riskDuesSum.toLocaleString()}</strong>.
            We recommend triggering WhatsApp renewal reminders or reviewing seat reservations on the Dues Tracker.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/dues"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <span>Go to Dues Tracker</span>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

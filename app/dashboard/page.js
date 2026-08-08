"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Grid,
  Clock,
  UserCheck,
  Plus,
  CreditCard,
  Building2,
  Calendar,
  Zap,
  Banknote,
  Wallet,
  Globe,
  CalendarDays,
  UserMinus,
  Gauge,
  Download,
  UserPlus,
  GraduationCap,
  PieChart,
  ArrowRight,
  Printer
} from "lucide-react";
import {
  fetchMembers,
  fetchPayments,
  fetchBranches,
  formatDate
} from "@/lib/adminService";
import { exportListToPDF } from "@/lib/pdfExport";

export default function OverviewDashboard() {
  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }); // YYYY-MM
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    async function load() {
      const [mList, pList, bList] = await Promise.all([
        fetchMembers(activeBranch),
        fetchPayments(activeBranch),
        fetchBranches()
      ]);
      setMembers(mList);
      setPayments(pList);
      setBranches(bList);
    }
    load();
  }, [activeBranch]);

  // Capacity
  const activeBranchCapacity = branches.find(b => b.code === activeBranch)?.total_capacity || 150;

  // Month-wise Payments Calculation
  const monthPayments = payments.filter((p) => {
    const pMonth = p.paid_at ? p.paid_at.substring(0, 7) : formatDate(new Date()).substring(0, 7);
    return pMonth === selectedMonth;
  });

  const cashRevenue = monthPayments
    .filter(p => p.payment_mode === "Cash")
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const onlineRevenue = monthPayments
    .filter(p => ["Online", "UPI", "Card"].includes(p.payment_mode))
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const receivedRevenue = cashRevenue + onlineRevenue;

  // Active & Left Members
  const activeMembers = members.filter(m => m.is_active && !m.left_at);
  const leftMembers = members.filter(m => m.status === 'LEFT' || m.left_at);

  // Upcoming Dues for members whose end date is in selected month
  const upcomingDuesMembers = activeMembers.filter((m) => {
    const endMonth = m.subscription_end_date ? m.subscription_end_date.substring(0, 7) : "";
    return endMonth === selectedMonth;
  });

  const upcomingDues = upcomingDuesMembers.reduce((sum, m) => sum + parseFloat(m.plan_amount || 1000), 0);
  // Total Revenue (Without subtracting expenses!)
  const totalRevenue = receivedRevenue + upcomingDues;

  // Defaulters Loss
  const totalLossAmount = members
    .filter(m => m.left_with_dues && parseFloat(m.loss_amount || 0) > 0)
    .reduce((sum, m) => sum + parseFloat(m.loss_amount || 0), 0);

  // Seating & Occupancy stats
  const occupiedSeatsSet = new Set(activeMembers.filter(m => m.seat_no).map(m => m.seat_no));
  const occupiedCount = occupiedSeatsSet.size;
  const occupancyRate = Number(((occupiedCount / activeBranchCapacity) * 100).toFixed(1));

  // Today's Operations Feed
  const todayStr = formatDate(new Date());
  const todayPayments = payments.filter(p => p.paid_at && p.paid_at.substring(0, 10) === todayStr);
  const todayCash = todayPayments.filter(p => p.payment_mode === "Cash").reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const todayOnline = todayPayments.filter(p => ["Online", "UPI", "Card"].includes(p.payment_mode)).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const todayAdmissions = members.filter(m => m.created_at && m.created_at.substring(0, 10) === todayStr);

  // Shifts Breakdown
  const fullDayCount = activeMembers.filter(m => m.shift === 'Full Day').length;
  const halfDayCount = activeMembers.filter(m => ['Morning', 'Evening', 'Half Day'].includes(m.shift)).length;
  const totalShiftCount = Math.max(1, fullDayCount + halfDayCount);
  const fullDayPercent = Math.round((fullDayCount / totalShiftCount) * 100);
  const halfDayPercent = 100 - fullDayPercent;

  const monthLabels = {
    "2026-08": "August 2026",
    "2026-07": "July 2026",
    "2026-06": "June 2026",
    "2026-05": "May 2026",
    "2026-04": "April 2026",
    "2026-03": "March 2026"
  };

  const handleExportPDF = () => {
    const columns = ["Financial Metric", "Value"];
    const rows = [
      ["Total Revenue (Received + Expected)", `Rs. ${totalRevenue.toLocaleString()}`],
      ["Received Revenue", `Rs. ${receivedRevenue.toLocaleString()}`],
      ["Cash Revenue", `Rs. ${cashRevenue.toLocaleString()}`],
      ["Online / UPI Revenue", `Rs. ${onlineRevenue.toLocaleString()}`],
      ["Upcoming Renewal Dues", `Rs. ${upcomingDues.toLocaleString()}`],
      ["Defaulter Payment Loss", `Rs. ${totalLossAmount.toLocaleString()}`],
      ["Active Students Count", `${activeMembers.length}`],
      ["Left Members Count", `${leftMembers.length}`],
      ["Seat Occupancy Rate", `${occupancyRate}%`]
    ];

    exportListToPDF({
      title: `Executive Financial & Operations Overview (${selectedMonth})`,
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
      <div className="space-y-6 selection:bg-slate-900 selection:text-white">
        
        {/* 1. Page Title & Export Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              Dashboard
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Monitor all branches and revenue streams.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/analytics"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <span>Check In-Depth Insights</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Export PDF Overview</span>
            </button>
          </div>
        </div>

        {/* 2. Billing Period Filter Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Billing Period Filter
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Filter collections and expected renewals month-wise
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs w-full sm:w-auto">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer w-full pr-2"
            >
              {Object.entries(monthLabels).map(([val, label]) => (
                <option key={val} value={val} className="bg-white text-slate-900 font-medium">
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Metric Tiles Grid */}
        <div className="space-y-4">
          {/* Top Row: 5 Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Tile 1: Total Revenue (NO EXPENSE SUBTRACTION!) */}
            <div className="bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/30 border border-blue-100 rounded-2xl p-5 shadow-2xs flex flex-col items-center text-center justify-between group hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-full bg-blue-100/80 text-blue-700 flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                TOTAL REVENUE
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                ₹{totalRevenue.toLocaleString()}
              </p>
            </div>

            {/* Tile 2: Received */}
            <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/30 border border-emerald-100 rounded-2xl p-5 shadow-2xs flex flex-col items-center text-center justify-between group hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-3">
                <Banknote className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                RECEIVED
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                ₹{receivedRevenue.toLocaleString()}
              </p>
            </div>

            {/* Tile 3: Cash Revenue */}
            <div className="bg-gradient-to-br from-[#ECFDF5] via-white to-emerald-50/40 border border-emerald-100 rounded-2xl p-5 shadow-2xs flex flex-col items-center text-center justify-between group hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                CASH REVENUE
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                ₹{cashRevenue.toLocaleString()}
              </p>
            </div>

            {/* Tile 4: Online Revenue */}
            <div className="bg-gradient-to-br from-[#EEF2FF] via-white to-blue-50/40 border border-indigo-100 rounded-2xl p-5 shadow-2xs flex flex-col items-center text-center justify-between group hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-full bg-indigo-100/80 text-indigo-700 flex items-center justify-center mb-3">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                ONLINE REVENUE
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                ₹{onlineRevenue.toLocaleString()}
              </p>
            </div>

            {/* Tile 5: Upcoming */}
            <div className="bg-gradient-to-br from-amber-50/80 via-white to-yellow-50/30 border border-amber-100 rounded-2xl p-5 shadow-2xs flex flex-col items-center text-center justify-between group hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center mb-3">
                <CalendarDays className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                UPCOMING
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                ₹{upcomingDues.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Bottom Row: 4 Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tile 6: Loss Payment */}
            <div className="bg-gradient-to-br from-rose-50/80 via-white to-red-50/30 border border-rose-100 rounded-2xl p-5 shadow-2xs flex flex-col items-center text-center justify-between group hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-full bg-rose-100/80 text-rose-700 flex items-center justify-center mb-3">
                <TrendingDown className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                LOSS PAYMENT
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                ₹{totalLossAmount.toLocaleString()}
              </p>
            </div>

            {/* Tile 7: Left Members */}
            <div className="bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 border border-amber-100 rounded-2xl p-5 shadow-2xs flex flex-col items-center text-center justify-between group hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-full bg-orange-100/80 text-orange-700 flex items-center justify-center mb-3">
                <UserMinus className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                LEFT MEMBERS
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                {leftMembers.length}
              </p>
            </div>

            {/* Tile 8: Active Members */}
            <div className="bg-gradient-to-br from-indigo-50/60 via-white to-slate-50/30 border border-indigo-100 rounded-2xl p-5 shadow-2xs flex flex-col items-center text-center justify-between group hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-full bg-indigo-100/80 text-indigo-700 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                ACTIVE
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                {activeMembers.length}
              </p>
            </div>

            {/* Tile 9: Occupancy */}
            <div className="bg-gradient-to-br from-yellow-50/80 via-white to-amber-50/40 border border-yellow-100 rounded-2xl p-5 shadow-2xs flex flex-col items-center text-center justify-between relative overflow-hidden group hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center mb-2">
                <Gauge className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                OCCUPANCY
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                {occupancyRate}%
              </p>
              <div className="w-full bg-amber-100 h-1.5 rounded-full overflow-hidden mt-3">
                <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, occupancyRate)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Today's Activity Section */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Today&apos;s Activity
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Real-time daily operations (Resets everyday)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: Today's Collections */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-3">
                TODAY&apos;S COLLECTIONS
              </span>
              <div className="flex items-center justify-between">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-700">Cash Collection</span>
                  </div>
                  <p className="font-mono font-bold text-slate-900 pl-4">₹{todayCash}</p>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="font-semibold text-slate-700">Online Collection</span>
                  </div>
                  <p className="font-mono font-bold text-slate-900 pl-4">₹{todayOnline}</p>
                </div>

                <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-2">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-tighter">
                    {todayCash + todayOnline > 0 ? `₹${todayCash + todayOnline}` : "NO COLLECTION"}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Today's New Members */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  TODAY&apos;S NEW MEMBERS
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono font-bold">
                  {todayAdmissions.length} NEW
                </span>
              </div>

              {todayAdmissions.length === 0 ? (
                <div className="py-6 text-center space-y-1">
                  <UserPlus className="w-6 h-6 text-slate-400 mx-auto opacity-50 mb-1" />
                  <p className="text-xs text-slate-500 font-medium">No new members registered today</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                  {todayAdmissions.map((m) => (
                    <div key={m.id} className="p-2 bg-white rounded-lg border border-slate-200 text-xs flex justify-between">
                      <span className="font-bold text-slate-900">{m.full_name}</span>
                      <span className="font-mono text-indigo-600 font-bold">₹{m.plan_amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Box 3: Today's Payments */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  TODAY&apos;S PAYMENTS
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-200">
                  {todayPayments.length} PAID
                </span>
              </div>

              {todayPayments.length === 0 ? (
                <div className="py-6 text-center space-y-1">
                  <CreditCard className="w-6 h-6 text-slate-400 mx-auto opacity-50 mb-1" />
                  <p className="text-xs text-slate-500 font-medium">No payments received today</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                  {todayPayments.map((p) => (
                    <div key={p.id} className="p-2 bg-white rounded-lg border border-slate-200 text-xs flex justify-between">
                      <span className="font-bold text-slate-900">{p.member_name}</span>
                      <span className="font-mono text-emerald-600 font-bold">₹{p.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5. Branch Revenue Split & Subscription Types Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Branch Revenue Split */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Branch Revenue Split
              </h3>
              <Link href="/dashboard/invoices" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4 pt-2">
              {branches.map((b, idx) => {
                const bRev = payments
                  .filter(p => p.branch === b.code && (p.paid_at ? p.paid_at.substring(0, 7) === selectedMonth : true))
                  .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                const percent = Math.min(100, Math.round((bRev / Math.max(1, receivedRevenue)) * 100));

                return (
                  <div key={b.code} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-indigo-500' : 'bg-amber-400'}`} />
                        <span>{b.name}</span>
                      </span>
                      <span className="font-mono text-slate-900">₹{bRev.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${idx === 0 ? 'bg-indigo-500' : 'bg-amber-400'}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subscription Types */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Subscription Types
            </h3>

            <div className="flex items-center justify-around py-4">
              <div className="w-28 h-28 rounded-full border-8 border-indigo-500 border-t-amber-400 flex flex-col items-center justify-center text-center p-2 shadow-inner">
                <span className="text-sm font-black text-slate-900 font-mono">100%</span>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">ACTIVE</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900">Full Day</p>
                    <p className="text-[11px] text-slate-500 font-medium">{fullDayPercent}% ({fullDayCount} students)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900">Half Day / Shift</p>
                    <p className="text-[11px] text-slate-500 font-medium">{halfDayPercent}% ({halfDayCount} students)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Quick Actions Section at Bottom */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Quick Actions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/dashboard/admission"
              className="bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-2 group transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                NEW ADMISSION
              </span>
            </Link>

            <Link
              href="/dashboard/members"
              className="bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-2 group transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                STUDENT DIRECTORY
              </span>
            </Link>

            <Link
              href="/dashboard/dues"
              className="bg-white border border-slate-200 hover:border-rose-400 hover:shadow-md rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-2 group transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                DUES TRACKER
              </span>
            </Link>

            <Link
              href="/dashboard/seating"
              className="bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-2 group transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex items-center justify-center">
                <Grid className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                SEAT MAP
              </span>
            </Link>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

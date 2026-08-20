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
  Printer,
  X,
  Search,
  ExternalLink
} from "lucide-react";
import {
  fetchMembers,
  fetchPayments,
  fetchBranches,
  formatDate,
  calculateMemberStatus
} from "@/lib/adminService";
import { exportListToPDF } from "@/lib/pdfExport";

export default function OverviewDashboard() {
  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState(() => formatDate(new Date()).substring(0, 7)); // YYYY-MM (e.g. "2026-08")
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [branches, setBranches] = useState([]);

  // Modal State for Financial & Student Breakdown
  const [activeModal, setActiveModal] = useState(null); // 'TOTAL' | 'RECEIVED' | 'CASH' | 'ONLINE' | 'UPCOMING' | 'LOSS' | 'LEFT' | 'ACTIVE' | null
  const [modalSearch, setModalSearch] = useState("");
  const [modalMonth, setModalMonth] = useState(() => formatDate(new Date()).substring(0, 7));
  const [userRole, setUserRole] = useState("admin");

  useEffect(() => {
    async function load() {
      const role = localStorage.getItem("mindspace_user_role") || "admin";
      setUserRole(role);
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

  // Billing month options
  const monthLabels = {
    "ALL": "All Time (Total History)",
    "2026-05": "May 2026",
    "2026-06": "June 2026",
    "2026-07": "July 2026",
    "2026-08": "August 2026",
    "2026-09": "September 2026",
    "2026-10": "October 2026",
    "2026-11": "November 2026",
    "2026-12": "December 2026"
  };

  const activeBranchCapacity = activeBranch === "main_branch" ? 113 : (branches.find(b => b.code === activeBranch)?.total_capacity || 113);

  // Payments in selected month (or ALL)
  const monthPayments = payments.filter((p) => {
    if (selectedMonth === "ALL") return true;
    const pDate = p.paid_at || p.created_at;
    const pMonth = pDate ? pDate.substring(0, 7) : formatDate(new Date()).substring(0, 7);
    return pMonth === selectedMonth;
  });

  let cashRevenue = 0;
  let onlineRevenue = 0;

  monthPayments.forEach(p => {
    const amt = parseFloat(p.amount || 0);
    if (p.payment_mode === "Cash") {
      cashRevenue += amt;
    } else if (p.payment_mode === "Split" || p.payment_mode === "Cash + Online") {
      let cAmt = parseFloat(p.cash_amount);
      let oAmt = parseFloat(p.online_amount);
      if (isNaN(cAmt) || isNaN(oAmt) || (cAmt === 0 && oAmt === 0)) {
        const matchCash = p.notes?.match(/Cash:?\s*₹?\s*(\d+)/i);
        const matchOnline = p.notes?.match(/Online:?\s*₹?\s*(\d+)/i);
        cAmt = matchCash ? parseFloat(matchCash[1]) : Math.round(amt / 2);
        oAmt = matchOnline ? parseFloat(matchOnline[1]) : (amt - cAmt);
      }
      cashRevenue += cAmt;
      onlineRevenue += oAmt;
    } else {
      onlineRevenue += amt;
    }
  });

  const receivedRevenue = cashRevenue + onlineRevenue;

  // Active & Left Members
  const activeMembers = members.filter(m => m.is_active && !m.left_at && m.status !== 'LEFT');
  const leftMembers = members.filter(m => m.status === 'LEFT' || m.left_at || !m.is_active);

  const currentMonthStr = formatDate(new Date()).substring(0, 7);

  // Helper function to assign an upcoming/overdue member to their exact due month
  const getMemberDueMonth = (m) => {
    // 1. Promised due date takes priority if present (e.g., 2026-08-25)
    if (m.due_date) {
      return String(m.due_date).substring(0, 7);
    }
    // 2. Subscription end date (expiry date)
    if (m.subscription_end_date) {
      const expMonth = String(m.subscription_end_date).substring(0, 7);
      // User Rule: If a member is OVERDUE (expiry was in past month) and still active today,
      // shift their overdue into the current active month's upcoming dues and total business revenue!
      if (expMonth < currentMonthStr && m.is_active) {
        return currentMonthStr;
      }
      return expMonth;
    }
    return currentMonthStr;
  };

  const upcomingDuesMembers = activeMembers.filter((m) => {
    const status = calculateMemberStatus(m);
    const dues = parseFloat(m.outstanding_dues || 0);
    const hasPendingOrDueStatus = dues > 0 || status === 'PENDING' || status === 'DUE_SOON' || status === 'OVERDUE';
    if (!hasPendingOrDueStatus) return false;

    if (selectedMonth === "ALL") return true;

    // Filter strictly by the member's due month
    const dueMonth = getMemberDueMonth(m);
    return dueMonth === selectedMonth;
  });

  const upcomingDues = upcomingDuesMembers.reduce((sum, m) => {
    const dues = parseFloat(m.outstanding_dues || 0);
    if (dues > 0) return sum + dues;
    return sum + parseFloat(m.plan_amount || 1100);
  }, 0);

  // Total Business Revenue for the selected month = Received Collections + Upcoming Dues due in that month
  const totalRevenue = receivedRevenue + upcomingDues;

  const totalLossAmount = members
    .filter(m => m.left_with_dues && parseFloat(m.loss_amount || 0) > 0)
    .reduce((sum, m) => sum + parseFloat(m.loss_amount || 0), 0);

  // Seating stats
  const occupiedSeatsSet = new Set(activeMembers.filter(m => m.seat_no).map(m => m.seat_no));
  const occupiedCount = occupiedSeatsSet.size;
  const availableSeats = Math.max(0, activeBranchCapacity - occupiedCount);
  const occupancyRate = ((occupiedCount / activeBranchCapacity) * 100).toFixed(1);

  // Payments filtered by modal's month
  const modalPayments = payments.filter((p) => {
    if (modalMonth === "ALL") return true;
    const pDate = p.paid_at || p.created_at;
    const pMonth = pDate ? pDate.substring(0, 7) : formatDate(new Date()).substring(0, 7);
    return pMonth === modalMonth;
  });

  const modalCashRevenue = modalPayments.reduce((sum, p) => {
    const amt = parseFloat(p.amount || 0);
    if (p.payment_mode === "Cash") return sum + amt;
    if (p.payment_mode?.includes("Split")) {
      const cAmt = parseFloat(p.cash_amount);
      return sum + (isNaN(cAmt) ? Math.round(amt / 2) : cAmt);
    }
    return sum;
  }, 0);

  const modalOnlineRevenue = modalPayments.reduce((sum, p) => {
    const amt = parseFloat(p.amount || 0);
    if (["Online", "UPI", "Card"].includes(p.payment_mode)) return sum + amt;
    if (p.payment_mode?.includes("Split")) {
      const oAmt = parseFloat(p.online_amount);
      return sum + (isNaN(oAmt) ? Math.round(amt / 2) : oAmt);
    }
    return sum;
  }, 0);

  const modalTotalReceived = modalCashRevenue + modalOnlineRevenue;

  const modalUpcomingDuesMembers = activeMembers.filter((m) => {
    const status = calculateMemberStatus(m);
    const dues = parseFloat(m.outstanding_dues || 0);
    const hasPendingOrDueStatus = dues > 0 || status === 'PENDING' || status === 'DUE_SOON' || status === 'OVERDUE';
    if (!hasPendingOrDueStatus) return false;

    if (modalMonth === "ALL") return true;

    const dueMonth = getMemberDueMonth(m);
    return dueMonth === modalMonth;
  });

  const modalUpcomingDues = modalUpcomingDuesMembers.reduce((sum, m) => {
    const dues = parseFloat(m.outstanding_dues || 0);
    if (dues > 0) return sum + dues;
    return sum + parseFloat(m.plan_amount || 1100);
  }, 0);

  const modalTotalBusinessRevenue = modalTotalReceived + modalUpcomingDues;

  // Filter Data for Modal View
  const getModalData = () => {
    const q = modalSearch.toLowerCase().trim();
    if (activeModal === "TOTAL" || activeModal === "RECEIVED") {
      return modalPayments.filter(p => {
        return !q || p.member_name?.toLowerCase().includes(q) || p.invoice_id?.toLowerCase().includes(q) || p.payment_mode?.toLowerCase().includes(q) || p.notes?.toLowerCase().includes(q);
      });
    }
    if (activeModal === "CASH") {
      return modalPayments.filter(p => {
        const isCash = p.payment_mode === "Cash" || (p.payment_mode?.includes("Split") && (p.cash_amount > 0 || p.notes?.toLowerCase().includes("cash")));
        const matches = !q || p.member_name?.toLowerCase().includes(q) || p.invoice_id?.toLowerCase().includes(q);
        return isCash && matches;
      });
    }
    if (activeModal === "ONLINE") {
      return modalPayments.filter(p => {
        const isOnline = ["Online", "UPI", "Card"].includes(p.payment_mode) || (p.payment_mode?.includes("Split") && (p.online_amount > 0 || p.notes?.toLowerCase().includes("online")));
        const matches = !q || p.member_name?.toLowerCase().includes(q) || p.invoice_id?.toLowerCase().includes(q);
        return isOnline && matches;
      });
    }
    if (activeModal === "UPCOMING") {
      return modalUpcomingDuesMembers.filter(m => {
        return !q || m.full_name?.toLowerCase().includes(q) || m.permanent_id?.toLowerCase().includes(q) || m.mobile?.includes(q);
      });
    }
    if (activeModal === "LOSS") {
      return members.filter(m => m.left_with_dues && parseFloat(m.loss_amount || 0) > 0).filter(m => {
        return !q || m.full_name?.toLowerCase().includes(q) || m.permanent_id?.toLowerCase().includes(q) || m.mobile?.includes(q);
      });
    }
    if (activeModal === "LEFT") {
      return leftMembers.filter(m => {
        return !q || m.full_name?.toLowerCase().includes(q) || m.permanent_id?.toLowerCase().includes(q) || m.mobile?.includes(q);
      });
    }
    if (activeModal === "ACTIVE") {
      return activeMembers.filter(m => {
        return !q || m.full_name?.toLowerCase().includes(q) || m.permanent_id?.toLowerCase().includes(q) || m.mobile?.includes(q);
      });
    }
    return [];
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
              Monitor all branches, revenue streams and live student payment statuses.
            </p>
          </div>
          
          {userRole !== "staff" && (
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
          )}
        </div>

        {/* 2. Billing Period Filter Card (Admin only) */}
        {userRole !== "staff" && (
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
                  Filter collections and expected renewals month-wise (Click any tile below for full breakdown modal)
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
        )}

        {/* 3. Metric Tiles Grid */}
        <div className="space-y-4">
          {userRole !== "staff" ? (
            <>
              {/* Top Row: 5 Financial Tiles (Admin Only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Tile 1: Total Revenue */}
                <div
                  onClick={() => { setActiveModal("TOTAL"); setModalSearch(""); setModalMonth(selectedMonth); }}
                  className="bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/30 border border-blue-100 hover:border-blue-400 rounded-2xl p-5 shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center justify-between group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100/80 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                    TOTAL REVENUE
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                    ₹{totalRevenue.toLocaleString()}
                  </p>
                  <div className="mt-1 text-[9px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    Rec. ₹{receivedRevenue.toLocaleString()} + Due ₹{upcomingDues.toLocaleString()}
                  </div>
                  <span className="text-[9px] font-bold text-blue-600 group-hover:underline mt-2 flex items-center gap-1">
                    Click for Payment Ledger
                  </span>
                </div>

                {/* Tile 2: Received */}
                <div
                  onClick={() => { setActiveModal("RECEIVED"); setModalSearch(""); setModalMonth(selectedMonth); }}
                  className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/30 border border-emerald-100 hover:border-emerald-400 rounded-2xl p-5 shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center justify-between group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                    RECEIVED
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                    ₹{receivedRevenue.toLocaleString()}
                  </p>
                  <div className="mt-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    Cash ₹{cashRevenue.toLocaleString()} + UPI ₹{onlineRevenue.toLocaleString()}
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600 group-hover:underline mt-2 flex items-center gap-1">
                    Click for Payment Logs
                  </span>
                </div>

                {/* Tile 3: Cash Revenue */}
                <div
                  onClick={() => { setActiveModal("CASH"); setModalSearch(""); setModalMonth(selectedMonth); }}
                  className="bg-gradient-to-br from-[#ECFDF5] via-white to-emerald-50/40 border border-emerald-100 hover:border-emerald-400 rounded-2xl p-5 shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center justify-between group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                    CASH REVENUE
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                    ₹{cashRevenue.toLocaleString()}
                  </p>
                  <div className="mt-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    Cash Received
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600 group-hover:underline mt-2 flex items-center gap-1">
                    Click for Cash Logs
                  </span>
                </div>

                {/* Tile 4: Online Revenue */}
                <div
                  onClick={() => { setActiveModal("ONLINE"); setModalSearch(""); setModalMonth(selectedMonth); }}
                  className="bg-gradient-to-br from-[#EEF2FF] via-white to-blue-50/40 border border-indigo-100 hover:border-indigo-400 rounded-2xl p-5 shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center justify-between group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100/80 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Globe className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                    ONLINE REVENUE
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                    ₹{onlineRevenue.toLocaleString()}
                  </p>
                  <div className="mt-1 text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    UPI / Online / Card
                  </div>
                  <span className="text-[9px] font-bold text-indigo-600 group-hover:underline mt-2 flex items-center gap-1">
                    Click for UPI Logs
                  </span>
                </div>

                {/* Tile 5: Upcoming */}
                <div
                  onClick={() => { setActiveModal("UPCOMING"); setModalSearch(""); setModalMonth(selectedMonth); }}
                  className="bg-gradient-to-br from-amber-50/80 via-white to-yellow-50/30 border border-amber-100 hover:border-amber-400 rounded-2xl p-5 shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center justify-between group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                    UPCOMING
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                    ₹{upcomingDues.toLocaleString()}
                  </p>
                  <div className="mt-1 text-[9px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Pending + PayLater ({upcomingDuesMembers.length})
                  </div>
                  <span className="text-[9px] font-bold text-amber-700 group-hover:underline mt-2 flex items-center gap-1">
                    Click for Dues Summary
                  </span>
                </div>
              </div>

              {/* Bottom Row: 4 Tiles (Admin Only Loss Payment + Operational) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tile 6: Loss Payment */}
                <div
                  onClick={() => { setActiveModal("LOSS"); setModalSearch(""); setModalMonth(selectedMonth); }}
                  className="bg-gradient-to-br from-rose-50/80 via-white to-red-50/30 border border-rose-100 hover:border-rose-400 rounded-2xl p-5 shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center justify-between group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-100/80 text-rose-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                    LOSS PAYMENT
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                    ₹{totalLossAmount.toLocaleString()}
                  </p>
                  <span className="text-[9px] font-bold text-rose-600 group-hover:underline mt-2 flex items-center gap-1">
                    Click for Defaulter Log
                  </span>
                </div>

                {/* Tile 7: Left Members */}
                <div
                  onClick={() => { setActiveModal("LEFT"); setModalSearch(""); setModalMonth(selectedMonth); }}
                  className="bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 border border-amber-100 hover:border-orange-400 rounded-2xl p-5 shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center justify-between group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100/80 text-orange-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UserMinus className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                    LEFT MEMBERS
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                    {leftMembers.length}
                  </p>
                  <span className="text-[9px] font-bold text-orange-600 group-hover:underline mt-2 flex items-center gap-1">
                    Click for Left Members
                  </span>
                </div>

                {/* Tile 8: Active Members */}
                <div
                  onClick={() => { setActiveModal("ACTIVE"); setModalSearch(""); setModalMonth(selectedMonth); }}
                  className="bg-gradient-to-br from-indigo-50/60 via-white to-slate-50/30 border border-indigo-100 hover:border-indigo-400 rounded-2xl p-5 shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center justify-between group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100/80 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                    ACTIVE
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                    {activeMembers.length}
                  </p>
                  <span className="text-[9px] font-bold text-indigo-600 group-hover:underline mt-2 flex items-center gap-1">
                    Click for Student Roster
                  </span>
                </div>

                {/* Tile 9: Occupancy */}
                <div className="bg-gradient-to-br from-yellow-50/80 via-white to-amber-50/40 border border-yellow-100 rounded-2xl p-5 shadow-2xs flex flex-col items-center text-center justify-between relative overflow-hidden group">
                  <div className="w-10 h-10 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center mb-2">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                    OCCUPANCY
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <p className="text-2xl font-black text-slate-900 font-mono">
                      {occupancyRate}%
                    </p>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono font-bold mt-2">
                    {occupiedCount} / {activeBranchCapacity} seats
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* Operational Only Tiles Grid (Staff Desk View - NO REVENUE NUMBERS) */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tile 1: Active Members */}
              <div
                onClick={() => { setActiveModal("ACTIVE"); setModalSearch(""); }}
                className="bg-gradient-to-br from-indigo-50/60 via-white to-slate-50/30 border border-indigo-100 hover:border-indigo-400 rounded-2xl p-6 shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center justify-between group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold tracking-wider uppercase text-slate-400">
                  ACTIVE STUDENTS
                </span>
                <p className="text-3xl font-black text-slate-900 font-mono mt-1">
                  {activeMembers.length}
                </p>
                <span className="text-xs font-bold text-indigo-600 group-hover:underline mt-2">
                  View Active Student Roster
                </span>
              </div>

              {/* Tile 2: Left Members */}
              <div
                onClick={() => { setActiveModal("LEFT"); setModalSearch(""); }}
                className="bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 border border-amber-100 hover:border-orange-400 rounded-2xl p-6 shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center justify-between group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UserMinus className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold tracking-wider uppercase text-slate-400">
                  LEFT MEMBERS
                </span>
                <p className="text-3xl font-black text-slate-900 font-mono mt-1">
                  {leftMembers.length}
                </p>
                <span className="text-xs font-bold text-orange-600 group-hover:underline mt-2">
                  View Left Members Archive
                </span>
              </div>

              {/* Tile 3: Occupancy */}
              <div className="bg-gradient-to-br from-yellow-50/80 via-white to-amber-50/40 border border-yellow-100 rounded-2xl p-6 shadow-2xs flex flex-col items-center text-center justify-between group">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                  <Gauge className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold tracking-wider uppercase text-slate-400">
                  SEAT OCCUPANCY
                </span>
                <p className="text-3xl font-black text-slate-900 font-mono mt-1">
                  {occupancyRate}%
                </p>
                <span className="text-xs text-slate-500 font-mono font-bold mt-2">
                  {occupiedCount} of {activeBranchCapacity} desks assigned
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4. Operations Feed */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-600" />
                <span>Today&apos;s Live Operations Feed ({new Date().toISOString().substring(0, 10)})</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">Real-time revenue & admission logging for today</p>
            </div>
            {userRole !== "staff" && (
              <div className="flex items-center gap-3 text-xs font-mono font-bold">
                <span className="px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Cash Today: ₹{payments.filter(p => p.paid_at && p.paid_at.substring(0, 10) === new Date().toISOString().substring(0, 10) && p.payment_mode === "Cash").reduce((s, p) => s + parseFloat(p.amount || 0), 0)}
                </span>
                <span className="px-3 py-1.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                  UPI Today: ₹{payments.filter(p => p.paid_at && p.paid_at.substring(0, 10) === new Date().toISOString().substring(0, 10) && p.payment_mode !== "Cash").reduce((s, p) => s + parseFloat(p.amount || 0), 0)}
                </span>
              </div>
            )}
          </div>

          {/* Today's Live Grid */}
          {(() => {
            const todayStr = new Date().toISOString().substring(0, 10);
            const todaysPaymentsList = payments.filter(p => p.paid_at && p.paid_at.substring(0, 10) === todayStr);
            const todaysAdmissionsList = members.filter(m => m.joining_date && m.joining_date.substring(0, 10) === todayStr);

            if (todaysPaymentsList.length === 0 && todaysAdmissionsList.length === 0) {
              return (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                  <p className="text-xs font-bold text-slate-700">No Operations Logged Yet For Today ({todayStr})</p>
                  <p className="text-[11px] text-slate-400">New student registrations and payment entries for today will appear here live.</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Today's Payments Card */}
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Today&apos;s Payments ({todaysPaymentsList.length})</span>
                    </span>
                    <Link href="/dashboard/record-payment" className="text-[10px] text-cyan-600 font-bold hover:underline">Record Payment</Link>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {todaysPaymentsList.map((p) => (
                      <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs shadow-2xs">
                        <div>
                          <p className="font-extrabold text-slate-900">{p.member_name || "Student"}</p>
                          <p className="text-[10px] text-slate-500 font-mono font-medium">{p.notes || "Subscription Payment"} • <span className="font-bold text-slate-700">{p.payment_mode}</span></p>
                        </div>
                        <span className="font-mono font-black text-emerald-600 text-sm">₹{p.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Today's New Admissions Card */}
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Today&apos;s New Admissions ({todaysAdmissionsList.length})</span>
                    </span>
                    <Link href="/dashboard/admission" className="text-[10px] text-cyan-600 font-bold hover:underline">New Admission</Link>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {todaysAdmissionsList.map((m) => (
                      <div key={m.id} className="bg-white p-3 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs shadow-2xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">{m.full_name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 font-mono text-[9px] font-bold border border-cyan-200">{m.permanent_id}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">Shift: {m.shift} • Seat: {m.seat_no || "Unassigned"}</p>
                        </div>
                        <span className="font-mono font-bold text-slate-700 text-xs">₹{m.plan_amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* 5. Quick Actions Section */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            System Shortcuts
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

        {/* 6. POPUP BREAKDOWN MODAL WITH FULL STUDENT & PAYMENT DETAILS */}
        {activeModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setActiveModal(null)}
          >
            <div
              className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    {activeModal === 'TOTAL' && <Building2 className="w-5 h-5 text-blue-600" />}
                    {activeModal === 'RECEIVED' && <Banknote className="w-5 h-5 text-emerald-600" />}
                    {activeModal === 'CASH' && <Wallet className="w-5 h-5 text-emerald-600" />}
                    {activeModal === 'ONLINE' && <Globe className="w-5 h-5 text-indigo-600" />}
                    {activeModal === 'UPCOMING' && <CalendarDays className="w-5 h-5 text-amber-600" />}
                    {activeModal === 'LOSS' && <TrendingDown className="w-5 h-5 text-rose-600" />}
                    {activeModal === 'LEFT' && <UserMinus className="w-5 h-5 text-orange-600" />}
                    {activeModal === 'ACTIVE' && <Users className="w-5 h-5 text-indigo-600" />}
                    <span>
                      {activeModal === 'TOTAL' && 'Total Revenue Payment Ledger'}
                      {activeModal === 'RECEIVED' && 'Received Payment Transactions History'}
                      {activeModal === 'CASH' && 'Cash Revenue Payment Ledger'}
                      {activeModal === 'ONLINE' && 'Online / UPI Revenue Payment Ledger'}
                      {activeModal === 'UPCOMING' && 'Upcoming & Pending Receivables Breakdown'}
                      {activeModal === 'LOSS' && 'Defaulters Loss Recovery Log'}
                      {activeModal === 'LEFT' && 'Left Members History'}
                      {activeModal === 'ACTIVE' && 'Active Library Students Directory'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Branch: <strong className="uppercase text-slate-700">{activeBranch}</strong> | Month Filter: <strong className="text-indigo-600 font-bold">{monthLabels[modalMonth] || modalMonth}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Interactive Month Filter Dropdown inside Modal */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-2xl shadow-2xs">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">Month:</span>
                    <select
                      value={modalMonth}
                      onChange={(e) => setModalMonth(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer pr-1"
                    >
                      {Object.entries(monthLabels).map(([val, label]) => (
                        <option key={val} value={val} className="bg-white text-slate-900 font-medium">
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Search Bar & Record Counter */}
              <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search student name, permanent ID (MS-...), phone, invoice..."
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 outline-none focus:border-cyan-500"
                  />
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3.5 py-2 rounded-2xl shrink-0 text-center">
                  {getModalData().length} items found
                </span>
              </div>

              {/* Summary Banner for Payment Revenue Modals */}
              {["TOTAL", "RECEIVED", "CASH", "ONLINE"].includes(activeModal) && (
                <div className="px-6 pt-4">
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-wrap items-center justify-between text-xs font-mono font-bold text-slate-800 gap-2">
                    <span>Business Breakdown ({monthLabels[modalMonth] || modalMonth}):</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-emerald-700">Rec: ₹{modalTotalReceived.toLocaleString()}</span>
                      <span className="text-amber-700">Due: ₹{modalUpcomingDues.toLocaleString()}</span>
                      <span className="bg-slate-900 text-white px-3 py-1 rounded-xl">Total Business: ₹{modalTotalBusinessRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* List / Table Content */}
              <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar flex-1">
                {getModalData().length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-medium text-xs">
                    No matching record logs found for this filter in {monthLabels[modalMonth] || modalMonth}.
                  </div>
                ) : (
                  getModalData().map((item) => {
                    // Check if item is a Payment transaction or Member object
                    const isPayment = Boolean(item.paid_at || item.invoice_id);

                    if (isPayment) {
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-md transition-all gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-sm">
                                {item.member_name || "Student"}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-mono text-[10px] font-bold">
                                {item.invoice_id}
                              </span>
                            </div>
                            <p className="text-slate-500 font-medium text-[11px]">
                              {item.notes || "Subscription Payment"}
                            </p>
                            <p className="text-slate-400 font-mono text-[10px]">
                              Paid Date: {formatDate(item.paid_at || item.created_at)}
                            </p>
                          </div>

                          <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1 shrink-0">
                            <span className="font-mono font-black text-emerald-600 text-sm">
                              ₹{item.amount}
                            </span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                              {item.payment_mode || "UPI"}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    // Otherwise it's a Member object
                    const m = item;
                    const isLeftMember = m.status === 'LEFT' || m.left_at || !m.is_active;
                    const memberStatus = calculateMemberStatus(m);
                    const dues = parseFloat(m.outstanding_dues || 0);
                    const paidAmount = (m.plan_amount || 1100) - dues;

                    return (
                      <div
                        key={m.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-md transition-all gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">{m.full_name}</span>
                            <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono text-[10px] font-bold">
                              {m.permanent_id || "STUDENT"}
                            </span>
                            {m.seat_no && (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                                Seat #{m.seat_no}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                            <span>Phone: <strong className="font-mono text-slate-700">{m.mobile}</strong></span>
                            <span>Shift: <strong className="text-slate-700">{m.shift}</strong></span>
                            {m.subscription_end_date && (
                              <span>Expires: <strong className="font-mono text-slate-700">{m.subscription_end_date.substring(0, 10)}</strong></span>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className="text-slate-500">Plan: ₹{m.plan_amount || 1100}</span>
                            <span>•</span>
                            <span className="text-emerald-600 font-bold">Paid: ₹{Math.max(0, paidAmount)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isLeftMember ? (
                              m.left_with_dues || parseFloat(m.loss_amount || 0) > 0 ? (
                                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                  LEFT (Unpaid Loss: ₹{m.loss_amount || dues})
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                                  LEFT (Exit Settled)
                                </span>
                              )
                            ) : memberStatus === 'OVERDUE' ? (
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                OVERDUE (Expired)
                              </span>
                            ) : memberStatus === 'DUE_SOON' ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-900 border border-yellow-300">
                                DUE SOON (Renewal Pending)
                              </span>
                            ) : memberStatus === 'PENDING' || dues > 0 ? (
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                                ₹{dues} Dues Pending
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Paid (Active)
                              </span>
                            )}

                            <Link
                              href={`/dashboard/record-payment?memberId=${m.id}`}
                              className="p-1.5 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-600 hover:text-white transition-colors"
                              title="Record Payment"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

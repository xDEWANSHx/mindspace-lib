"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Clock,
  Send,
  Search,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Calendar,
  IndianRupee,
  MapPin,
  User,
  Printer
} from "lucide-react";
import {
  fetchMembers,
  calculateMemberStatus
} from "@/lib/adminService";
import { exportListToPDF } from "@/lib/pdfExport";

const STATUS_CONFIG = {
  OVERDUE:  { label: "Overdue",    bg: "bg-rose-50",   text: "text-rose-700",   border: "border-rose-200"  },
  PENDING:  { label: "Pending",    bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  DUE_SOON: { label: "Due Soon",   bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
};

export default function DuesTrackerPage() {
  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); });
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, OVERDUE, PENDING, DUE_SOON
  const [sortBy, setSortBy] = useState("dues-desc"); // dues-desc, dues-asc, name-asc, newest, oldest

  useEffect(() => {
    async function load() {
      const mList = await fetchMembers(activeBranch);
      setMembers(mList);
    }
    load();
  }, [activeBranch]);

  const duesMembers = members.filter(m => {
    const status = calculateMemberStatus(m);
    const hasDues = status === "OVERDUE" || status === "PENDING" || status === "DUE_SOON";
    if (!hasDues || !m.is_active) return false;

    if (activeTab !== "ALL" && status !== activeTab) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return m.full_name?.toLowerCase().includes(q) || m.permanent_id?.toLowerCase().includes(q) || m.mobile?.includes(q);
    }
    return true;
  }).sort((a, b) => {
    const getVal = (m) => parseFloat(m.outstanding_dues > 0 ? m.outstanding_dues : (m.plan_amount || 1000));
    if (sortBy === "dues-desc") return getVal(b) - getVal(a);
    if (sortBy === "dues-asc") return getVal(a) - getVal(b);
    if (sortBy === "name-asc") return (a.full_name || "").localeCompare(b.full_name || "");
    if (sortBy === "oldest") {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    }
    // Default newest
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  // Accurately sum total outstanding dues without false inflation
  const totalDuesAmount = duesMembers.reduce((sum, m) => {
    const val = parseFloat(m.outstanding_dues > 0 ? m.outstanding_dues : (calculateMemberStatus(m) === "OVERDUE" ? (m.plan_amount || 1000) : 0));
    return sum + val;
  }, 0);

  const overdueCount  = members.filter(m => calculateMemberStatus(m) === "OVERDUE"  && m.is_active).length;
  const pendingCount  = members.filter(m => calculateMemberStatus(m) === "PENDING"  && m.is_active).length;
  const dueSoonCount  = members.filter(m => calculateMemberStatus(m) === "DUE_SOON" && m.is_active).length;

  const handleExportPDF = () => {
    const columns = ["ID", "Student Name", "Mobile", "Seat", "Shift", "Due Date / Expiry", "Dues Amount", "Status"];
    const rows = duesMembers.map(m => {
      const status = calculateMemberStatus(m);
      const duesVal = m.outstanding_dues > 0 ? m.outstanding_dues : (m.plan_amount || 1000);
      return [
        m.permanent_id || "-",
        m.full_name,
        m.mobile,
        m.seat_no || "Unassigned",
        m.shift || "Full Day",
        m.subscription_end_date || m.due_date || "-",
        `Rs. ${duesVal}`,
        status
      ];
    });

    exportListToPDF({
      title: "Pending Dues & Overdue Members Report",
      columns,
      data: rows
    });
  };

  return (
    <DashboardLayout activeBranch={activeBranch} setActiveBranch={setActiveBranch} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}>
      <div className="space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Dues & Overdue Tracker</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Monitor pending dues, upcoming expirations and dispatch WhatsApp reminders
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 font-mono text-amber-700 font-bold text-xs flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Total Outstanding: ₹{totalDuesAmount.toLocaleString()}</span>
            </div>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Summary Stat Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-rose-400">Overdue</p>
              <p className="text-2xl font-black text-rose-700 font-mono">{overdueCount}</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">Pending</p>
              <p className="text-2xl font-black text-amber-700 font-mono">{pendingCount}</p>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-yellow-500">Due Soon</p>
              <p className="text-2xl font-black text-yellow-700 font-mono">{dueSoonCount}</p>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-full sm:w-auto">
            {["ALL", "OVERDUE", "PENDING", "DUE_SOON"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab === "DUE_SOON" ? "Due Soon" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none shadow-sm cursor-pointer"
            >
              <option value="dues-desc">Dues (High to Low)</option>
              <option value="dues-asc">Dues (Low to High)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Name, ID or Mobile..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Member Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {duesMembers.length === 0 ? (
            <div className="col-span-full bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">All Clear — No Pending Dues</p>
              <p className="text-xs text-slate-400">No overdue or pending subscriptions found for the current filter.</p>
            </div>
          ) : (
            duesMembers.map(m => {
              const status = calculateMemberStatus(m);
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
              const duesVal = m.outstanding_dues > 0 ? m.outstanding_dues : (m.plan_amount || 1000);
              const waMsg = `Polite reminder from Mindspace Library: Dear ${m.full_name}, your dues/renewal amount of ₹${duesVal} for Seat ${m.seat_no || "N/A"} is pending. Please renew at the earliest.`;

              return (
                <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {m.permanent_id || "–"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 text-sm">{m.full_name}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-400 font-medium">Outstanding</p>
                      <p className="text-lg font-black font-mono text-amber-600">₹{duesVal}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 rounded-xl p-2.5 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono font-medium text-slate-700 truncate">{m.mobile}</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">Seat {m.seat_no || "–"}</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700 truncate">{m.shift || "Full Day"}</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-mono font-bold text-amber-700 text-[10px]">{m.subscription_end_date?.substring(0,10) || "–"}</span>
                    </div>
                  </div>

                  {/* WhatsApp Action */}
                  <div className="pt-2 border-t border-slate-100">
                    <a
                      href={`https://wa.me/91${m.mobile}?text=${encodeURIComponent(waMsg)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1db954] text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send WhatsApp Reminder</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

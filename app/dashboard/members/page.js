"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Users,
  Search,
  Grid,
  List,
  UserCheck,
  Clock,
  UserMinus,
  X,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Send,
  FileText,
  DollarSign,
  Edit3,
  BookOpen,
  Printer,
  Download,
  Lock
} from "lucide-react";
import {
  fetchMembers,
  fetchPayments,
  updateMember,
  deleteMember,
  markMemberLeft,
  readmitMember,
  deletePayment,
  recordPayment,
  settleLossPayment,
  calculateMemberStatus,
  seedFreshComprehensiveData,
  formatDate
} from "@/lib/adminService";
import { exportListToPDF } from "@/lib/pdfExport";

export default function MembersDirectoryPage() {
  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState("2026-07");
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, ACTIVE, PENDING, OVERDUE, DUE_SOON, UNRESERVED, LEFT
  const [viewMode, setViewMode] = useState("grid"); // grid | table
  const [selectedMember, setSelectedMember] = useState(null);
  const [userRole, setUserRole] = useState("admin");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("mindspace_user_role") || "admin";
      setUserRole(role);
    }
  }, []);

  // Payment History Modal State
  const [paymentHistoryModalOpen, setPaymentHistoryModalOpen] = useState(false);
  const [historyMember, setHistoryMember] = useState(null);

  // Edit Profile Modal State with ALL fields editable!
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    full_name: "",
    student_no: "",
    father_name: "",
    mobile: "",
    dob: "",
    gender: "Male",
    address: "",
    aadhar_no: "",
    targeting_exam: "",
    shift: "Full Day",
    seat_no: "",
    joining_date: "",
    subscription_end_date: "",
    plan_amount: 1100,
    outstanding_dues: 0,
    pay_later: false,
    due_date: "",
    has_locker: false,
    locker_no: "",
    is_active: true
  });

  // Action Modals
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewDays, setRenewDays] = useState(30);
  const [renewAmount, setRenewAmount] = useState(1100);
  const [renewMode, setRenewMode] = useState("UPI");

  const [markLeftModalOpen, setMarkLeftModalOpen] = useState(false);
  const [leftReason, setLeftReason] = useState("");
  const [leftWithDues, setLeftWithDues] = useState(false);
  const [lossAmount, setLossAmount] = useState(0);

  const [settleLossModalOpen, setSettleLossModalOpen] = useState(false);
  const [settleAmount, setSettleAmount] = useState(0);
  const [settleMode, setSettleMode] = useState("Cash");
  const [reactivateChecked, setReactivateChecked] = useState(false);

  useEffect(() => {
    async function load() {
      const [mList, pList] = await Promise.all([
        fetchMembers(activeBranch),
        fetchPayments(activeBranch)
      ]);
      setMembers(mList);
      setPayments(pList);

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const qId = params.get("memberId") || params.get("openId");
        if (qId && mList.length > 0) {
          const match = mList.find(m => m.id === qId || m.permanent_id === qId || m.student_no === qId);
          if (match) {
            setSelectedMember(match);
          }
        }
      }
    }
    load();
  }, [activeBranch]);

  const reloadData = async () => {
    const [mList, pList] = await Promise.all([
      fetchMembers(activeBranch),
      fetchPayments(activeBranch)
    ]);
    setMembers(mList);
    setPayments(pList);
    if (selectedMember) {
      const updated = mList.find(m => m.id === selectedMember.id);
      setSelectedMember(updated || null);
    }
  };

  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name-asc, name-desc, seat-asc, seat-desc

  // Filtered and sorted members calculation
  const filteredMembers = members.filter((m) => {
    const status = calculateMemberStatus(m);

    if (activeTab === "ACTIVE" && status !== "ACTIVE") return false;
    if (activeTab === "PENDING" && status !== "PENDING") return false;
    if (activeTab === "OVERDUE" && status !== "OVERDUE") return false;
    if (activeTab === "DUE_SOON" && status !== "DUE_SOON") return false;
    if (activeTab === "UNRESERVED" && (m.seat_no && m.seat_no.trim() !== '' && m.seat_no.trim() !== '-' || status === "LEFT")) return false;
    if (activeTab === "LEFT" && status !== "LEFT") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.full_name?.toLowerCase().includes(q);
      const matchId = m.permanent_id?.toLowerCase().includes(q);
      const matchPhone = m.mobile?.includes(q);
      const matchSeat = m.seat_no?.toLowerCase().includes(q);
      const matchLocker = m.locker_no?.toLowerCase().includes(q);
      const matchShift = m.shift?.toLowerCase().includes(q);
      return matchName || matchId || matchPhone || matchSeat || matchLocker || matchShift;
    }

    return true;
  }).sort((a, b) => {
    if (activeTab === 'LEFT' || (a.status === 'LEFT' && b.status === 'LEFT')) {
      const leftTimeA = a.left_at ? new Date(a.left_at).getTime() : (a.updated_at ? new Date(a.updated_at).getTime() : 0);
      const leftTimeB = b.left_at ? new Date(b.left_at).getTime() : (b.updated_at ? new Date(b.updated_at).getTime() : 0);
      if (leftTimeA !== leftTimeB && !isNaN(leftTimeA) && !isNaN(leftTimeB)) {
        return leftTimeB - leftTimeA;
      }
    }

    if (sortBy === 'name-asc') return (a.full_name || '').localeCompare(b.full_name || '');
    if (sortBy === 'name-desc') return (b.full_name || '').localeCompare(a.full_name || '');
    
    if (sortBy === 'oldest') {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : (a.joining_date ? new Date(a.joining_date).getTime() : 0);
      const timeB = b.created_at ? new Date(b.created_at).getTime() : (b.joining_date ? new Date(b.joining_date).getTime() : 0);
      if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB) && timeA > 0 && timeB > 0) {
        return timeA - timeB;
      }
      const numA = parseInt(String(a.permanent_id || a.student_no || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.permanent_id || b.student_no || '').replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    }
    
    if (sortBy === 'seat-asc' || sortBy === 'seat-desc') {
      const rawA = a.seat_no || '';
      const rawB = b.seat_no || '';
      const numA = parseInt(rawA.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(rawB.replace(/\D/g, ''), 10) || 0;
      return sortBy === 'seat-asc' ? numA - numB : numB - numA;
    }

    // Default: newest
    const timeA = a.created_at ? new Date(a.created_at).getTime() : (a.joining_date ? new Date(a.joining_date).getTime() : 0);
    const timeB = b.created_at ? new Date(b.created_at).getTime() : (b.joining_date ? new Date(b.joining_date).getTime() : 0);
    if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB) && timeA > 0 && timeB > 0) {
      return timeB - timeA;
    }
    const numA = parseInt(String(a.permanent_id || a.student_no || '').replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(String(b.permanent_id || b.student_no || '').replace(/\D/g, ''), 10) || 0;
    return numB - numA;
  });

  // Action: Open Edit Modal with ALL FIELDS initialized
  const openEditModal = (m) => {
    const memPayments = payments.filter(p => p.member_id === m.id);
    const latestP = memPayments.length > 0 ? memPayments[0] : null;
    const currentSubStart = latestP?.start_date ? latestP.start_date.substring(0, 10) : (latestP?.paid_at ? latestP.paid_at.substring(0, 10) : m.joining_date);

    setEditData({
      full_name: m.full_name || "",
      student_no: m.student_no || "",
      father_name: m.father_name || "",
      mobile: m.mobile || "",
      dob: m.dob || "",
      gender: m.gender || "Male",
      address: m.address || "",
      aadhar_no: m.aadhar_no || "",
      targeting_exam: m.targeting_exam || "",
      shift: m.shift || "Full Day",
      seat_no: m.seat_no || "",
      joining_date: m.joining_date || "",
      sub_start_date: currentSubStart || m.joining_date || "",
      subscription_end_date: m.subscription_end_date || (currentSubStart ? addOneMonth(currentSubStart) : ""),
      plan_amount: m.plan_amount !== undefined ? m.plan_amount : 1100,
      outstanding_dues: m.outstanding_dues || 0,
      pay_later: m.pay_later || false,
      due_date: m.due_date || "",
      has_locker: m.has_locker || false,
      locker_no: m.locker_no || "",
      is_active: m.is_active !== false
    });
    setEditProfileModalOpen(true);
  };

  // Action: Save Edit Profile
  const handleSaveProfileEdit = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;

    let finalPlanAmt = parseFloat(editData.plan_amount || 1100);
    if (editData.shift === "Full Day" && (finalPlanAmt === 600 || !editData.plan_amount)) {
      finalPlanAmt = 1100;
    }
    const finalSubEnd = editData.subscription_end_date || (editData.sub_start_date ? addOneMonth(editData.sub_start_date) : selectedMember.subscription_end_date);

    const updates = {
      full_name: editData.full_name,
      student_no: editData.student_no,
      father_name: editData.father_name,
      mobile: editData.mobile,
      dob: editData.dob,
      gender: editData.gender,
      address: editData.address,
      aadhar_no: editData.aadhar_no,
      targeting_exam: editData.targeting_exam,
      shift: editData.shift,
      seat_no: editData.seat_no ? editData.seat_no : null,
      joining_date: editData.joining_date,
      subscription_end_date: finalSubEnd,
      plan_amount: finalPlanAmt,
      outstanding_dues: parseFloat(editData.outstanding_dues || 0),
      due_date: editData.due_date ? editData.due_date : null,
      dues_due_date: editData.due_date ? editData.due_date : null,
      has_locker: editData.has_locker,
      locker_no: editData.has_locker ? (editData.locker_no || null) : null,
      is_active: editData.is_active
    };

    await updateMember(selectedMember.id, updates, 'Admin', selectedMember);

    // Sync latest payment's start_date if edited
    const memPayments = payments.filter(p => p.member_id === selectedMember.id);
    if (memPayments.length > 0 && editData.sub_start_date) {
      const latestP = memPayments[0];
      try {
        await supabase.from('payments').update({ start_date: editData.sub_start_date }).eq('id', latestP.id);
      } catch (err) {}
    }

    setEditProfileModalOpen(false);
    await reloadData();
    alert(`Updated student profile for ${editData.full_name}!`);
  };

  // PDF Export
  const handleExportPDF = () => {
    const columns = ["ID", "Student Name", "Mobile", "Shift", "Seat", "Locker", "Expiry Date", "Dues", "Status"];
    const rows = filteredMembers.map(m => [
      m.permanent_id || "-",
      m.full_name,
      m.mobile,
      m.shift,
      m.seat_no || "Unassigned",
      m.has_locker ? (m.locker_no || "Yes") : "No",
      m.subscription_end_date || "-",
      `Rs. ${m.outstanding_dues || 0}`,
      calculateMemberStatus(m)
    ]);
    exportListToPDF({
      title: "Students Master Directory Report",
      columns,
      data: rows
    });
  };

  const handleDeletePayment = async (pId) => {
    if (!confirm("Are you sure you want to delete this payment transaction?")) return;
    await deletePayment(pId);
    await reloadData();
  };

  const handlePerformRenewal = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;

    await recordPayment({
      member_id: selectedMember.id,
      member_name: selectedMember.full_name,
      amount: renewAmount,
      branch: activeBranch,
      payment_mode: renewMode,
      notes: `Subscription Renewal (${renewDays} days)`,
      is_renewal: true,
      extend_days: renewDays
    });

    setRenewModalOpen(false);
    await reloadData();
    alert(`Successfully renewed subscription for ${selectedMember.full_name}!`);
  };

  const handlePerformMarkLeft = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;

    await markMemberLeft(selectedMember.id, {
      dues_unpaid: leftWithDues,
      loss_amount: leftWithDues ? parseFloat(lossAmount || 0) : 0,
      left_reason: leftReason || "Student marked left"
    }, 'Admin');

    setMarkLeftModalOpen(false);
    await reloadData();
    alert(`Student ${selectedMember.full_name} (${selectedMember.permanent_id}) marked as LEFT. Lifetime profile & payment history archived safely!`);
  };

  const handlePerformSettleLoss = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;

    await settleLossPayment({
      member_id: selectedMember.id,
      member_name: selectedMember.full_name,
      amount_paid: settleAmount,
      payment_mode: settleMode,
      reactivate: reactivateChecked,
      notes: "Settle Loss Payment Fee",
      branch: activeBranch
    });

    setSettleLossModalOpen(false);
    await reloadData();
    alert(`Loss payment settled for ${selectedMember.full_name}!`);
  };

  const handlePerformDelete = async (id, name) => {
    if (userRole === "staff") {
      alert("Permission Denied: Staff members cannot delete student records permanently.");
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete member ${name}?`)) return;
    const res = await deleteMember(id, name, userRole === "staff" ? "Staff" : "Admin");
    if (res === false) return;
    setSelectedMember(null);
    await reloadData();
    alert(`Permanently deleted student ${name}.`);
  };

  return (
    <DashboardLayout activeBranch={activeBranch} setActiveBranch={setActiveBranch} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}>
      <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-600" />
              <span>Students Master Directory</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Manage active library members, shift plans, seat allocations & payment ledgers</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab(activeTab === "LEFT" ? "ALL" : "LEFT")}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                activeTab === "LEFT"
                  ? "bg-amber-500 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400"
                  : "bg-slate-900 text-amber-300 hover:bg-slate-800 border border-slate-700"
              }`}
            >
              <UserMinus className="w-4 h-4 text-amber-400" />
              <span>Left Students Panel ({members.filter(m => m.status === "LEFT" || m.is_active === false).length})</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Export PDF</span>
            </button>

            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "grid" ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Grid className="w-4 h-4" />
                <span className="hidden sm:inline">Tiles</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "table" ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto custom-scrollbar shadow-sm">
            {[
              { id: "ALL", label: "All Members" },
              { id: "ACTIVE", label: "Active (Paid)" },
              { id: "PENDING", label: "Pending Dues" },
              { id: "OVERDUE", label: "Overdue" },
              { id: "DUE_SOON", label: "Due Soon" },
              { id: "LEFT", label: "Left / Defaulters" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/25"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200/80 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-cyan-500 shadow-sm cursor-pointer"
            >
              <option value="newest">Newest Members</option>
              <option value="oldest">Oldest Members</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="seat-asc">Seat (Low to High)</option>
              <option value="seat-desc">Seat (High to Low)</option>
            </select>

            {/* Search Bar */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Name, ID, Mobile, Seat, Locker..."
                className="w-full bg-white border border-slate-200/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 outline-none focus:border-cyan-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Members Grid / Table View */}
        {filteredMembers.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 shadow-sm">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40 text-cyan-600" />
            <p className="text-xs font-medium">No student records found matching your active filter or search query.</p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredMembers.map((m) => {
              const status = calculateMemberStatus(m);
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMember(m)}
                  className="bg-white border border-slate-200/80 hover:border-cyan-400 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer space-y-4 flex flex-col justify-between group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-700 font-extrabold bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200">
                        {m.permanent_id}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 mt-2.5 group-hover:text-cyan-600 transition-colors">{m.full_name}</h3>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-cyan-600" />
                        <span>{m.mobile}</span>
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow-sm ${
                        status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        status === "OVERDUE" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                        status === "PENDING" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        status === "DUE_SOON" ? "bg-orange-50 text-orange-700 border border-orange-200" :
                        status === "LEFT" ? "bg-slate-100 text-slate-500 border border-slate-200" :
                        "bg-cyan-50 text-cyan-700 border border-cyan-200"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60 text-[11px]">
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 font-extrabold block">Shift</span>
                      <p className="font-bold text-slate-800 truncate">{m.shift}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 font-extrabold block">Seat</span>
                      <p className="font-mono font-bold text-cyan-700">{m.seat_no || "Unassigned"}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 font-extrabold block">Locker</span>
                      <p className="font-mono font-bold text-purple-600">{m.has_locker ? (m.locker_no || "Assigned") : "No"}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 font-extrabold block">Dues</span>
                      <p className="font-mono font-bold text-amber-600">₹{m.outstanding_dues || 0}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-4">Permanent ID</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Mobile</th>
                    <th className="p-4">Shift & Seat</th>
                    <th className="p-4">Locker</th>
                    <th className="p-4">Expiry Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Dues / Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((m) => {
                    const status = calculateMemberStatus(m);
                    return (
                      <tr
                        key={m.id}
                        onClick={() => setSelectedMember(m)}
                        className="hover:bg-cyan-50/50 cursor-pointer transition-colors"
                      >
                        <td className="p-4 font-mono font-bold text-cyan-700">{m.permanent_id}</td>
                        <td className="p-4 font-bold text-slate-900">{m.full_name}</td>
                        <td className="p-4 font-mono text-slate-600">{m.mobile}</td>
                        <td className="p-4 text-slate-700">
                          {m.shift} • <span className="font-mono font-bold text-cyan-700">{m.seat_no || "Unassigned"}</span>
                        </td>
                        <td className="p-4 font-mono text-purple-700 font-bold">
                          {m.has_locker ? (m.locker_no || "Yes") : "No"}
                        </td>
                        <td className="p-4 font-mono text-slate-600">{m.subscription_end_date}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                              status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              status === "OVERDUE" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                              "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-amber-600">
                          {m.left_with_dues ? `Loss: ₹${m.loss_amount}` : `₹${m.outstanding_dues}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CENTERED MODAL POPUP DIALOG FOR STUDENT PROFILE DETAILS */}
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 animate-popIn">
              {/* Modal Topbar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
                    {selectedMember.full_name?.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-cyan-700 font-extrabold bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                      {selectedMember.permanent_id}
                    </span>
                    <h2 className="text-lg font-black text-slate-900 mt-0.5">{selectedMember.full_name}</h2>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-2 rounded-2xl bg-slate-100 text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                <Link
                  href={`/dashboard/record-payment?memberId=${selectedMember.id}`}
                  className="p-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/25 text-center cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Record Pay</span>
                </Link>

                <button
                  onClick={() => { setHistoryMember(selectedMember); setPaymentHistoryModalOpen(true); }}
                  className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Receipts History</span>
                </button>

                <button
                  onClick={() => openEditModal(selectedMember)}
                  className="p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => { setRenewModalOpen(true); setRenewAmount(selectedMember.plan_amount || 1100); }}
                  className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Renew Plan</span>
                </button>

                {selectedMember.status === "LEFT" || selectedMember.is_active === false ? (
                  <Link
                    href={`/dashboard/admission?phone=${selectedMember.mobile}`}
                    className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 text-center cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Re-Admit</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => setMarkLeftModalOpen(true)}
                    className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <UserMinus className="w-4 h-4" />
                    <span>Mark Left</span>
                  </button>
                )}

                {userRole !== "staff" && (
                  <button
                    onClick={() => handlePerformDelete(selectedMember.id, selectedMember.full_name)}
                    className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Record</span>
                  </button>
                )}
              </div>

              {/* Personal Details */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">Personal & Membership Details</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div><span className="text-slate-400 font-medium block">Lifetime MSL ID:</span> <p className="font-bold font-mono text-cyan-700">{selectedMember.permanent_id || selectedMember.student_no || "MSL0001"}</p></div>
                  <div><span className="text-slate-400 font-medium block">Father Name:</span> <p className="font-bold text-slate-800">{selectedMember.father_name || "N/A"}</p></div>
                  <div><span className="text-slate-400 font-medium block">Mobile Phone:</span> <p className="font-mono font-bold text-cyan-700">{selectedMember.mobile}</p></div>
                  <div><span className="text-slate-400 font-medium block">Gender & DOB:</span> <p className="font-bold text-slate-800">{selectedMember.gender || "Male"} • {selectedMember.dob || "N/A"}</p></div>
                  <div><span className="text-slate-400 font-medium block">Address:</span> <p className="font-bold text-slate-800 truncate">{selectedMember.address || "N/A"}</p></div>
                  <div><span className="text-slate-400 font-medium block">Aadhar No:</span> <p className="font-mono font-bold text-slate-800">{selectedMember.aadhar_no || "N/A"}</p></div>
                  <div><span className="text-slate-400 font-medium block">Target Exam:</span> <p className="font-bold text-slate-800">{selectedMember.targeting_exam || "General Study"}</p></div>
                  <div><span className="text-slate-400 font-medium block">Shift Plan:</span> <p className="font-bold text-slate-800">{selectedMember.shift}</p></div>
                  <div><span className="text-slate-400 font-medium block">Assigned Seat:</span> <p className="font-mono font-bold text-cyan-700">{selectedMember.seat_no || "Unassigned"}</p></div>
                  <div><span className="text-slate-400 font-medium block">Locker Assigned:</span> <p className="font-mono font-bold text-purple-700">{selectedMember.has_locker ? (selectedMember.locker_no || "Yes") : "No Locker"}</p></div>
                  <div><span className="text-slate-400 font-medium block">Initial Admission Date:</span> <p className="font-mono font-bold text-slate-700">{selectedMember.joining_date || "N/A"}</p></div>
                  <div><span className="text-slate-400 font-medium block">Subscription Start Date:</span> <p className="font-mono font-bold text-indigo-600">{(() => {
                    const memPayments = payments.filter(p => p.member_id === selectedMember.id);
                    if (memPayments.length > 0) {
                      const latestPayment = memPayments[0];
                      const latestDate = latestPayment.start_date ? latestPayment.start_date.substring(0, 10) : (latestPayment.paid_at ? latestPayment.paid_at.substring(0, 10) : null);
                      if (latestDate) return latestDate;
                    }
                    return selectedMember.joining_date || "N/A";
                  })()}</p></div>
                  <div><span className="text-slate-400 font-medium block">Subscription Expiry Date:</span> <p className="font-mono font-bold text-emerald-600">{(() => {
                    const memPayments = payments.filter(p => p.member_id === selectedMember.id);
                    const latestPayment = memPayments.length > 0 ? memPayments[0] : null;
                    const subStart = latestPayment?.start_date ? latestPayment.start_date.substring(0, 10) : (latestPayment?.paid_at ? latestPayment.paid_at.substring(0, 10) : selectedMember.joining_date);
                    if (subStart) return addOneMonth(subStart);
                    return selectedMember.subscription_end_date || "N/A";
                  })()}</p></div>
                  <div><span className="text-slate-400 font-medium block">Duration:</span> <p className="font-mono font-bold text-slate-700">1 Month</p></div>
                  <div><span className="text-slate-400 font-medium block">Outstanding Dues:</span> <p className="font-mono font-bold text-amber-600">₹{selectedMember.outstanding_dues || 0}</p></div>
                  {selectedMember.outstanding_dues > 0 && (
                    <div><span className="text-slate-400 font-medium block">Promised Due Date:</span> <p className="font-mono font-black text-rose-600">{selectedMember.due_date || selectedMember.dues_due_date || "Not Set"}</p></div>
                  )}
                </div>
              </div>

              {/* Payment History Ledger */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Payment History Ledger</h4>
                <div className="space-y-2">
                  {payments.filter(p => p.member_id === selectedMember.id).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No payment transaction records logged for this student.</p>
                  ) : (
                    payments.filter(p => p.member_id === selectedMember.id).map(p => (
                      <div key={p.id} className="flex justify-between items-center p-3 rounded-2xl bg-white border border-slate-200 text-xs shadow-sm">
                        <div>
                          <p className="font-bold text-slate-900">Invoice: {p.invoice_id}</p>
                          <p className="text-[10px] text-slate-500">{p.notes || "Subscription Payment"} • {p.paid_at ? p.paid_at.substring(0,10) : ""}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-mono font-black text-emerald-600">₹{p.amount}</p>
                            <span className="text-[9px] text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full font-bold border border-cyan-200">{p.payment_mode}</span>
                          </div>
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            title="Delete Payment Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit Student Profile (ALL FIELDS EDITABLE!) */}
        {editProfileModalOpen && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn">
            <form onSubmit={handleSaveProfileEdit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-popIn">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Edit Complete Student Profile</h3>
                <button type="button" onClick={() => setEditProfileModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editData.full_name}
                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Lifetime MSL Student ID</label>
                  <input
                    type="text"
                    value={editData.student_no}
                    onChange={(e) => setEditData({ ...editData, student_no: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Father&apos;s Name</label>
                  <input
                    type="text"
                    value={editData.father_name}
                    onChange={(e) => setEditData({ ...editData, father_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={editData.mobile}
                    onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Date of Birth</label>
                  <input
                    type="date"
                    value={editData.dob}
                    onChange={(e) => setEditData({ ...editData, dob: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Gender</label>
                  <select
                    value={editData.gender}
                    onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-bold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Targeting Exam</label>
                  <input
                    type="text"
                    value={editData.targeting_exam}
                    onChange={(e) => setEditData({ ...editData, targeting_exam: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Aadhar No</label>
                  <input
                    type="text"
                    value={editData.aadhar_no}
                    onChange={(e) => setEditData({ ...editData, aadhar_no: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-500 font-bold mb-1 block">Residential Address</label>
                  <input
                    type="text"
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Shift Plan *</label>
                  <select
                    value={editData.shift}
                    onChange={(e) => {
                      const newShift = e.target.value;
                      const autoPlanPrice = newShift === "Full Day" ? 1100 : (newShift === "Morning" || newShift === "Evening" ? 600 : editData.plan_amount);
                      setEditData({ ...editData, shift: newShift, plan_amount: autoPlanPrice });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-bold"
                  >
                    <option value="Full Day">Full Day Access (06:00 AM - 10:00 PM)</option>
                    <option value="Morning">Morning Shift (06:00 AM - 02:00 PM)</option>
                    <option value="Evening">Evening Shift (02:00 PM - 10:00 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Assigned Seat No</label>
                  <input
                    type="text"
                    value={editData.seat_no}
                    onChange={(e) => setEditData({ ...editData, seat_no: e.target.value })}
                    placeholder="e.g. SEAT-012"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-mono"
                  />
                </div>

                {/* Locker Toggle Switch & Number */}
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-purple-900 font-bold flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-purple-600" />
                      <span>Locker Facility Requested?</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const nextLocker = !editData.has_locker;
                          const basePrice = editData.shift === "Full Day" ? 1100 : 600;
                          const newPlanAmt = nextLocker ? (basePrice + 50) : basePrice;
                          let newDues = parseFloat(editData.outstanding_dues || 0);
                          if (newDues > newPlanAmt || newDues === parseFloat(editData.plan_amount || 0)) {
                            newDues = newPlanAmt;
                          }
                          setEditData({
                            ...editData,
                            has_locker: nextLocker,
                            plan_amount: newPlanAmt,
                            outstanding_dues: newDues
                          });
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                          editData.has_locker ? "bg-purple-600 text-white shadow-md" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {editData.has_locker ? "YES" : "NO"}
                      </button>
                    </div>
                  </div>

                  {editData.has_locker && (
                    <div className="pt-2 border-t border-purple-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-purple-700 block">Locker Assignment Status</span>
                        {editData.locker_no ? (
                          <span className="font-mono font-black text-purple-950 text-sm">Assigned: {editData.locker_no}</span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-300">
                            UNASSIGNED LOCKER
                          </span>
                        )}
                      </div>

                      <Link
                        href="/dashboard/seating?tab=LOCKERS"
                        className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[11px] shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer w-fit"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Assign from Locker Map Section</span>
                      </Link>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-slate-600 font-bold mb-1 block">Initial Admission Date</label>
                  <input
                    type="date"
                    value={editData.joining_date}
                    onChange={(e) => setEditData({ ...editData, joining_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-indigo-800 font-extrabold mb-1 block">Subscription Start Date (Current Cycle)</label>
                  <input
                    type="date"
                    value={editData.sub_start_date}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setEditData({
                        ...editData,
                        sub_start_date: newStart,
                        subscription_end_date: newStart ? addOneMonth(newStart) : editData.subscription_end_date
                      });
                    }}
                    className="w-full bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3 text-indigo-950 font-mono font-black outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-emerald-800 font-extrabold mb-1 block">Subscription Expiry Date (Valid Till)</label>
                  <input
                    type="date"
                    value={editData.subscription_end_date}
                    onChange={(e) => setEditData({ ...editData, subscription_end_date: e.target.value })}
                    className="w-full bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 text-emerald-950 font-mono font-black outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Base Plan Price (₹)</label>
                  <input
                    type="number"
                    value={editData.plan_amount}
                    onChange={(e) => setEditData({ ...editData, plan_amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Outstanding Dues (₹)</label>
                  <input
                    type="number"
                    value={editData.outstanding_dues}
                    onChange={(e) => setEditData({ ...editData, outstanding_dues: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Promised Payment Due Date</label>
                  <input
                    type="date"
                    value={editData.due_date || ""}
                    onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-mono font-bold text-rose-600"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={editData.is_active}
                    onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <label htmlFor="editIsActive" className="text-slate-800 font-bold">Active Member Status</label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditProfileModalOpen(false)} className="flex-1 p-3.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="flex-1 p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-lg shadow-indigo-500/25">Save Complete Profile Changes</button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Renew Plan Popup */}
        {renewModalOpen && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn">
            <form onSubmit={handlePerformRenewal} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-4 shadow-2xl animate-popIn">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Renew Subscription: {selectedMember.full_name}</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Duration (Days)</label>
                  <input
                    type="number"
                    value={renewDays}
                    onChange={(e) => setRenewDays(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Amount Collected (₹)</label>
                  <input
                    type="number"
                    value={renewAmount}
                    onChange={(e) => setRenewAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Payment Mode</label>
                  <select
                    value={renewMode}
                    onChange={(e) => setRenewMode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-bold"
                  >
                    <option value="UPI">UPI / GPay</option>
                    <option value="Cash">Cash</option>
                    <option value="Online">Online Bank Transfer</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setRenewModalOpen(false)} className="flex-1 p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="flex-1 p-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-xs font-bold text-white shadow-lg shadow-cyan-500/25">Confirm Renewal</button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Mark Left Popup */}
        {markLeftModalOpen && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn">
            <form onSubmit={handlePerformMarkLeft} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-4 shadow-2xl animate-popIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <UserMinus className="w-4 h-4 text-amber-500" />
                  <span>Mark Student Left: {selectedMember.full_name}</span>
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 font-mono text-[11px] font-bold text-slate-700">
                  {selectedMember.permanent_id}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-700 font-extrabold mb-1.5 block">
                    Does this student have any unpaid payment dues? <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setLeftWithDues(true)}
                      className={`p-3 rounded-2xl text-xs font-black border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        leftWithDues ? "bg-rose-50 border-rose-500 text-rose-700 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>YES (Defaulter Loss)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeftWithDues(false)}
                      className={`p-3 rounded-2xl text-xs font-black border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        !leftWithDues ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>NO Dues (Clean Exit)</span>
                    </button>
                  </div>
                </div>

                {leftWithDues && (
                  <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 space-y-2">
                    <label className="text-rose-900 font-extrabold block">Unpaid Dues / Loss Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={lossAmount}
                      onChange={(e) => setLossAmount(e.target.value)}
                      placeholder="Enter lost amount..."
                      className="w-full bg-white border border-rose-300 rounded-xl p-3 text-rose-950 font-mono font-black outline-none focus:border-rose-500"
                    />
                    <p className="text-[10px] text-rose-700 font-semibold">This amount will be added to Total Defaulter Loss tracking.</p>
                  </div>
                )}

                <div>
                  <label className="text-slate-600 font-bold mb-1.5 block">Reason for Leaving</label>
                  <textarea
                    value={leftReason}
                    onChange={(e) => setLeftReason(e.target.value)}
                    placeholder="e.g. Exam completed, shifting location..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none h-20 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMarkLeftModalOpen(false)} className="flex-1 p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="flex-1 p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/25">Confirm Student Left</button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Lifetime Payment History Receipts */}
        {paymentHistoryModalOpen && historyMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-xl space-y-4 shadow-2xl animate-popIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-cyan-600" />
                    <span>Lifetime Payment Receipts: {historyMember.full_name}</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Permanent ID: {historyMember.permanent_id} | Mobile: {historyMember.mobile}</p>
                </div>
                <button onClick={() => setPaymentHistoryModalOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
                {payments.filter(p => p.member_id === historyMember.id || (p.member_name && p.member_name.toLowerCase() === historyMember.full_name.toLowerCase())).length > 0 ? (
                  payments
                    .filter(p => p.member_id === historyMember.id || (p.member_name && p.member_name.toLowerCase() === historyMember.full_name.toLowerCase()))
                    .map((p) => (
                      <div key={p.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{p.invoice_id || p.id}</span>
                            <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[10px] uppercase">{p.payment_mode || "Cash"}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{p.notes || "Subscription Payment"}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(p.created_at || p.paid_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-sm text-emerald-600 font-mono">₹{p.amount}</span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    No payment transaction receipts recorded yet for this student.
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button onClick={() => setPaymentHistoryModalOpen(false)} className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800">
                  Close History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

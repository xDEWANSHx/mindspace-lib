"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  CreditCard,
  Search,
  CheckCircle2,
  Send,
  Printer,
  Clock,
  DollarSign,
  FileText,
  Trash2,
  User,
  Filter,
  Edit3,
  X,
  Calendar,
  Sparkles,
  Check,
  AlertTriangle,
  Zap,
  HelpCircle
} from "lucide-react";
import {
  fetchMembers,
  fetchPayments,
  recordPayment,
  deletePayment,
  updateMember,
  formatDate
} from "@/lib/adminService";

function RecordPaymentContent() {
  const searchParams = useSearchParams();
  const queryMemberId = searchParams.get("memberId") || searchParams.get("member_id") || searchParams.get("id");

  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState("2026-07");
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [ledgerFilter, setLedgerFilter] = useState("ALL"); // ALL | SELECTED

  // Student Directory Left Card State
  const [directorySearch, setDirectorySearch] = useState("");
  const [directoryFilter, setDirectoryFilter] = useState("ALL"); // ALL | PAID | PARTIAL | PAY_LATER | OVERDUE | DUE_SOON

  // Quick Edit Student Modal
  const [manageStudentModalOpen, setManageStudentModalOpen] = useState(false);
  const [managedStudent, setManagedStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    mobile: "",
    shift: "Full Day",
    seat_no: "",
    joining_date: "",
    subscription_end_date: "",
    plan_amount: 1000,
    outstanding_dues: 0,
    payment_status: "PAID"
  });

  // Form State
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [paymentType, setPaymentType] = useState("FULL"); // FULL | PARTIAL | PAY_LATER | COLLECT_DUES
  const [planFee, setPlanFee] = useState(1000); // Base Plan Cost
  const [amountPaidToday, setAmountPaidToday] = useState(1000); // Actual Cash/Online collected today
  const [paymentMode, setPaymentMode] = useState("UPI"); // Cash | Online | Split
  const [cashAmount, setCashAmount] = useState(500);
  const [onlineAmount, setOnlineAmount] = useState(500);
  const [durationTab, setDurationTab] = useState("1M"); // 1M | 3M | 6M | 12M | CUSTOM
  const [extendDays, setExtendDays] = useState(30);
  const [notes, setNotes] = useState("");
  const [paidDate, setPaidDate] = useState("2026-08-08");
  const [successPayment, setSuccessPayment] = useState(null);

  useEffect(() => {
    setPaidDate(new Date().toISOString().substring(0, 10));
  }, []);

  // Split Auto-Calculations
  const handleCashAmountChange = (val) => {
    setCashAmount(val);
    const total = parseFloat(amountPaidToday) || 0;
    if (val === "") {
      setOnlineAmount(total);
    } else {
      const numVal = Math.max(0, parseFloat(val) || 0);
      setOnlineAmount(Math.max(0, total - numVal));
    }
  };

  const handleOnlineAmountChange = (val) => {
    setOnlineAmount(val);
    const total = parseFloat(amountPaidToday) || 0;
    if (val === "") {
      setCashAmount(total);
    } else {
      const numVal = Math.max(0, parseFloat(val) || 0);
      setCashAmount(Math.max(0, total - numVal));
    }
  };

  useEffect(() => {
    if (paymentMode === "Split") {
      const total = parseFloat(amountPaidToday) || 0;
      const c = parseFloat(cashAmount) || 0;
      if (cashAmount !== "" && c <= total && c > 0) {
        setOnlineAmount(total - c);
      } else {
        const half = Math.round(total / 2);
        setCashAmount(half);
        setOnlineAmount(total - half);
      }
    }
  }, [amountPaidToday, paymentMode]);

  // Sync duration tab to extendDays and Plan Fee
  useEffect(() => {
    if (durationTab === "1M") {
      setExtendDays(30);
      setPlanFee(1000);
      if (paymentType === "FULL") setAmountPaidToday(1000);
      else if (paymentType === "PAY_LATER") setAmountPaidToday(0);
    } else if (durationTab === "3M") {
      setExtendDays(90);
      setPlanFee(2800);
      if (paymentType === "FULL") setAmountPaidToday(2800);
      else if (paymentType === "PAY_LATER") setAmountPaidToday(0);
    } else if (durationTab === "6M") {
      setExtendDays(180);
      setPlanFee(5400);
      if (paymentType === "FULL") setAmountPaidToday(5400);
      else if (paymentType === "PAY_LATER") setAmountPaidToday(0);
    } else if (durationTab === "12M") {
      setExtendDays(365);
      setPlanFee(10000);
      if (paymentType === "FULL") setAmountPaidToday(10000);
      else if (paymentType === "PAY_LATER") setAmountPaidToday(0);
    }
  }, [durationTab, paymentType]);

  // Sync payment type to amount paid today
  useEffect(() => {
    if (paymentType === "FULL") {
      setAmountPaidToday(planFee);
    } else if (paymentType === "PAY_LATER") {
      setAmountPaidToday(0);
    } else if (paymentType === "PARTIAL") {
      setAmountPaidToday(Math.round(planFee / 2));
    } else if (paymentType === "COLLECT_DUES") {
      const selected = members.find(m => m.id === selectedMemberId);
      setAmountPaidToday(selected?.outstanding_dues || planFee);
    }
  }, [paymentType, planFee, selectedMemberId, members]);

  useEffect(() => {
    async function load() {
      const [mList, pList] = await Promise.all([
        fetchMembers(activeBranch),
        fetchPayments(activeBranch)
      ]);
      setMembers(mList);
      setPayments(pList);

      if (queryMemberId && mList.some(m => m.id === queryMemberId)) {
        setSelectedMemberId(queryMemberId);
        const m = mList.find(x => x.id === queryMemberId);
        if (m) {
          if (m.outstanding_dues > 0) {
            setPaymentType("COLLECT_DUES");
            setAmountPaidToday(m.outstanding_dues);
          } else {
            setPlanFee(m.plan_amount || 1000);
            setAmountPaidToday(m.plan_amount || 1000);
          }
        }
      } else if (mList.length > 0) {
        setSelectedMemberId(mList[0].id);
        setPlanFee(mList[0].plan_amount || 1000);
        setAmountPaidToday(mList[0].plan_amount || 1000);
      }
    }
    load();
  }, [activeBranch, queryMemberId]);

  const selectedMemberObj = members.find(m => m.id === selectedMemberId);

  // Auto-calculated Dues
  const currDues = selectedMemberObj?.outstanding_dues || 0;
  let calculatedNewDues = 0;
  if (paymentType === "FULL") {
    calculatedNewDues = 0;
  } else if (paymentType === "PARTIAL") {
    calculatedNewDues = currDues + Math.max(0, parseFloat(planFee || 0) - parseFloat(amountPaidToday || 0));
  } else if (paymentType === "PAY_LATER") {
    calculatedNewDues = currDues + parseFloat(planFee || 0);
  } else if (paymentType === "COLLECT_DUES") {
    calculatedNewDues = Math.max(0, currDues - parseFloat(amountPaidToday || 0));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMemberObj) return;

    const parsedPaidToday = parseFloat(amountPaidToday) || 0;
    const parsedPlanFee = parseFloat(planFee) || 0;

    const cPart = paymentMode === "Cash" ? parsedPaidToday : (paymentMode === "Split" ? (parseFloat(cashAmount) || 0) : 0);
    const oPart = (paymentMode === "Online" || paymentMode === "UPI") ? parsedPaidToday : (paymentMode === "Split" ? (parseFloat(onlineAmount) || 0) : 0);

    if (paymentMode === "Split" && parsedPaidToday > 0 && (cPart + oPart !== parsedPaidToday)) {
      alert(`Split payment total (Cash ₹${cPart} + Online ₹${oPart} = ₹${cPart + oPart}) does not equal total collected ₹${parsedPaidToday}`);
      return;
    }

    let defaultNote = "";
    let isRenewalAction = false;

    if (paymentType === "FULL") {
      defaultNote = `Full Subscription Renewal (${extendDays} days)`;
      isRenewalAction = true;
    } else if (paymentType === "PARTIAL") {
      defaultNote = `Partial Payment (Paid ₹${parsedPaidToday} of ₹${parsedPlanFee}, ₹${calculatedNewDues} Dues Pending)`;
      isRenewalAction = true;
    } else if (paymentType === "PAY_LATER") {
      defaultNote = `Pay Later Deferred Activation (${extendDays} days plan, ₹${calculatedNewDues} Total Overdue Dues)`;
      isRenewalAction = true;
    } else if (paymentType === "COLLECT_DUES") {
      defaultNote = `Pending Dues Recovery (Paid ₹${parsedPaidToday}, ₹${calculatedNewDues} Remaining Dues)`;
      isRenewalAction = false;
    }

    let finalNote = notes ? `${notes} - ${defaultNote}` : defaultNote;
    if (paymentMode === "Split" && parsedPaidToday > 0) {
      finalNote += ` (Split: Cash ₹${cPart}, Online ₹${oPart})`;
    }

    const p = await recordPayment({
      member_id: selectedMemberObj.id,
      member_name: selectedMemberObj.full_name,
      amount: parsedPaidToday,
      branch: activeBranch,
      payment_mode: parsedPaidToday === 0 ? "Deferred" : paymentMode,
      cash_amount: cPart,
      online_amount: oPart,
      notes: finalNote,
      is_renewal: isRenewalAction,
      extend_days: extendDays,
      new_outstanding_dues: calculatedNewDues
    });

    setSuccessPayment(p);
    const [mList, pList] = await Promise.all([
      fetchMembers(activeBranch),
      fetchPayments(activeBranch)
    ]);
    setMembers(mList);
    setPayments(pList);
  };

  const handleSelectStudentForPaymentEntry = (memberId, fallbackName) => {
    let target = members.find(m => m.id === memberId);
    if (!target && fallbackName) {
      target = members.find(m => m.full_name?.toLowerCase() === fallbackName.toLowerCase());
    }
    if (target) {
      setSelectedMemberId(target.id);
      if (target.outstanding_dues > 0) {
        setPaymentType("COLLECT_DUES");
        setAmountPaidToday(target.outstanding_dues);
      } else {
        setPaymentType("FULL");
        setPlanFee(target.plan_amount || 1000);
        setAmountPaidToday(target.plan_amount || 1000);
      }
      setLedgerFilter("SELECTED");
      const formEl = document.getElementById("record-transaction-card");
      if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleOpenManageStudent = (memberId, fallbackName) => {
    let target = members.find(m => m.id === memberId);
    if (!target && fallbackName) {
      target = members.find(m => m.full_name?.toLowerCase() === fallbackName.toLowerCase());
    }
    if (target) {
      setSelectedMemberId(target.id);
      setManagedStudent(target);
      setEditFormData({
        full_name: target.full_name || "",
        mobile: target.mobile || "",
        shift: target.shift || "Full Day",
        seat_no: target.seat_no || "",
        joining_date: target.joining_date || "",
        subscription_end_date: target.subscription_end_date || "",
        plan_amount: target.plan_amount || 1000,
        outstanding_dues: target.outstanding_dues || 0,
        payment_status: target.outstanding_dues > 0 ? (target.outstanding_dues < (target.plan_amount || 1000) ? "PARTIAL" : "UNPAID") : "PAID"
      });
      setManageStudentModalOpen(true);
    } else {
      alert(`Student details for "${fallbackName || 'Selected Student'}" could not be found.`);
    }
  };

  const handleSaveStudentEdit = async (e) => {
    e.preventDefault();
    if (!managedStudent) return;

    const updatedDues = parseFloat(editFormData.outstanding_dues || 0);

    await updateMember(managedStudent.id, {
      full_name: editFormData.full_name,
      mobile: editFormData.mobile,
      shift: editFormData.shift,
      seat_no: editFormData.seat_no ? editFormData.seat_no : null,
      joining_date: editFormData.joining_date,
      subscription_end_date: editFormData.subscription_end_date,
      plan_amount: parseFloat(editFormData.plan_amount || 1000),
      outstanding_dues: updatedDues,
      payment_status: updatedDues === 0 ? "PAID" : (updatedDues < parseFloat(editFormData.plan_amount || 1000) ? "PARTIAL" : "UNPAID")
    });

    setManageStudentModalOpen(false);
    const [mList, pList] = await Promise.all([
      fetchMembers(activeBranch),
      fetchPayments(activeBranch)
    ]);
    setMembers(mList);
    setPayments(pList);
    alert(`Student profile for ${editFormData.full_name} updated successfully across database!`);
  };

  const handleDeletePaymentRecord = async (paymentId) => {
    if (!confirm("Are you sure you want to delete this payment record? This will deduct the amount from total revenue.")) return;
    await deletePayment(paymentId);
    const pList = await fetchPayments(activeBranch);
    setPayments(pList);
  };

  // Filter Members in Students Directory
  const filteredDirectoryMembers = members.filter(m => {
    const matchesSearch = !directorySearch.trim() || (
      m.full_name?.toLowerCase().includes(directorySearch.toLowerCase()) ||
      m.permanent_id?.toLowerCase().includes(directorySearch.toLowerCase()) ||
      m.mobile?.includes(directorySearch)
    );
    if (!matchesSearch) return false;

    if (directoryFilter === "PAID") {
      return m.outstanding_dues === 0;
    }
    if (directoryFilter === "PARTIAL") {
      return m.outstanding_dues > 0 && m.outstanding_dues < (m.plan_amount || 1000);
    }
    if (directoryFilter === "PAY_LATER" || directoryFilter === "PENDING") {
      return m.outstanding_dues > 0;
    }
    if (directoryFilter === "OVERDUE") {
      if (!m.subscription_end_date) return m.outstanding_dues > 0;
      const end = new Date(m.subscription_end_date);
      const now = new Date();
      return end < now || m.outstanding_dues > 0;
    }
    if (directoryFilter === "DUE_SOON") {
      if (!m.subscription_end_date) return false;
      const end = new Date(m.subscription_end_date);
      const now = new Date();
      const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }
    return true;
  });

  return (
    <DashboardLayout activeBranch={activeBranch} setActiveBranch={setActiveBranch} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}>
      <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
        {/* Top Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-cyan-600" />
              <span>Record Payment & Subscription Hub</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Full Payment, Partial Deposit, Pay Later & Dues Recovery Engine</p>
          </div>
        </div>

        {/* 2-COLUMN TOP SECTION: STUDENTS DIRECTORY (LEFT) & RECORD TRANSACTION (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: STUDENTS DIRECTORY & SELECTED MEMBER CARD (5 COLUMNS) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Students Directory Box */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-600" />
                  <span>Students Directory</span>
                </h3>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {filteredDirectoryMembers.length} Members
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  placeholder="Search by name, ID, mobile..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-4 py-2 text-xs font-bold text-slate-800 outline-none focus:border-cyan-500"
                />
              </div>

              {/* Filter Badges */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-bold">
                {[
                  { id: "ALL", label: "All" },
                  { id: "PAID", label: "Paid" },
                  { id: "PARTIAL", label: "Partial" },
                  { id: "PAY_LATER", label: "Pay Later" },
                  { id: "OVERDUE", label: "Overdue" },
                  { id: "DUE_SOON", label: "Due Soon" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDirectoryFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      directoryFilter === tab.id
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Student Scrollable List */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {filteredDirectoryMembers.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-4 italic">No matching students found.</p>
                ) : (
                  filteredDirectoryMembers.map((m) => {
                    const isSelected = selectedMemberId === m.id;
                    const hasDues = m.outstanding_dues > 0;
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSelectedMemberId(m.id);
                          if (m.outstanding_dues > 0) {
                            setPaymentType("COLLECT_DUES");
                            setAmountPaidToday(m.outstanding_dues);
                          } else {
                            setPaymentType("FULL");
                            setPlanFee(m.plan_amount || 1000);
                            setAmountPaidToday(m.plan_amount || 1000);
                          }
                        }}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-cyan-50/80 border-cyan-400 shadow-sm"
                            : "bg-white border-slate-200/80 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${hasDues ? "bg-amber-500" : "bg-emerald-500"}`} />
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs">{m.full_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {m.permanent_id || "STUDENT"} {m.seat_no ? `• ${m.seat_no}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasDues ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"}`}>
                            {hasDues ? `₹${m.outstanding_dues} Dues` : "Paid (Active)"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. Selected Student Profile Card */}
            {selectedMemberObj && (
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4 animate-popIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      {selectedMemberObj.full_name?.charAt(0)?.toUpperCase() || "S"}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-white">{selectedMemberObj.full_name}</h4>
                      <p className="text-xs text-cyan-400 font-mono font-bold">{selectedMemberObj.permanent_id || "STUDENT ID"} • Mobile: {selectedMemberObj.mobile || "N/A"}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenManageStudent(selectedMemberObj.id, selectedMemberObj.full_name)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    title="Edit Profile"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-medium">
                  <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">SHIFT</span>
                    <span className="text-cyan-300 font-bold">{selectedMemberObj.shift || "Full Day"}</span>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">SEAT ASSIGNED</span>
                    <span className="text-emerald-400 font-mono font-bold">{selectedMemberObj.seat_no || "Unassigned"}</span>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50 col-span-2 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">EXPIRY / VALID TILL</span>
                      <span className="text-slate-200 font-mono font-bold">{selectedMemberObj.subscription_end_date || "Active"}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${selectedMemberObj.outstanding_dues > 0 ? "bg-amber-500 text-slate-950" : "bg-emerald-500 text-white"}`}>
                      {selectedMemberObj.outstanding_dues > 0 ? `₹${selectedMemberObj.outstanding_dues} Dues Pending` : "Paid (Active)"}
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT SIDE: RECORD TRANSACTION FORM (7 COLUMNS) */}
          <div id="record-transaction-card" className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm scroll-mt-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4.5 h-4.5 text-cyan-600" />
                <span>Record Transaction</span>
              </h3>
              <span className="text-xs font-extrabold text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
                {selectedMemberObj ? selectedMemberObj.full_name : "Select Student"}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              
              {/* 🌟 PAYMENT TYPE MODE SELECTOR: FULL / PARTIAL / PAY LATER / DUES 🌟 */}
              <div className="space-y-2">
                <label className="text-slate-500 font-bold block uppercase tracking-wider text-[10px]">PAYMENT SCHEME TYPE</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "FULL", label: "Full Payment", desc: "100% Paid", icon: CheckCircle2, bg: "hover:bg-emerald-50 active:bg-emerald-100" },
                    { id: "PARTIAL", label: "Partial Paid", desc: "Deposit + Dues", icon: Zap, bg: "hover:bg-amber-50 active:bg-amber-100" },
                    { id: "PAY_LATER", label: "Pay Later", desc: "100% Deferred", icon: Clock, bg: "hover:bg-rose-50 active:bg-rose-100" },
                    { id: "COLLECT_DUES", label: "Collect Dues", desc: "Recover Debt", icon: DollarSign, bg: "hover:bg-cyan-50 active:bg-cyan-100" }
                  ].map((scheme) => {
                    const IconComp = scheme.icon;
                    const isActive = paymentType === scheme.id;
                    return (
                      <button
                        key={scheme.id}
                        type="button"
                        onClick={() => setPaymentType(scheme.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isActive
                            ? "bg-slate-900 text-white border-slate-900 shadow-md"
                            : `bg-slate-50 border-slate-200 text-slate-700 ${scheme.bg}`
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <IconComp className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                        </div>
                        <div className="mt-2">
                          <p className="font-extrabold text-xs">{scheme.label}</p>
                          <p className={`text-[9px] font-medium ${isActive ? "text-slate-300" : "text-slate-400"}`}>{scheme.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PRICING & PLAN DURATION DETAILS */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Plan Duration & Base Pricing</span>
                  </span>
                  <span className="text-xs font-mono font-black text-slate-900">Base Fee: ₹{planFee}</span>
                </div>

                {/* Duration Tabs */}
                <div>
                  <label className="text-slate-500 font-bold mb-1.5 block">SELECT MEMBERSHIP DURATION</label>
                  <div className="grid grid-cols-5 gap-2">
                    {["1M", "3M", "6M", "12M", "CUSTOM"].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setDurationTab(tab)}
                        className={`py-2 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                          durationTab === tab
                            ? "bg-slate-900 text-white shadow-md"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {durationTab === "CUSTOM" && (
                  <div>
                    <label className="text-slate-500 font-bold mb-1 block">Extension Days</label>
                    <input
                      type="number"
                      value={extendDays}
                      onChange={(e) => setExtendDays(parseInt(e.target.value) || 30)}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-bold"
                    />
                  </div>
                )}
              </div>

              {/* AMOUNT COLLECTED TODAY VS DUES BREAKDOWN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-500 font-bold mb-1 block uppercase text-[10px]">
                    {paymentType === "PAY_LATER" ? "AMOUNT COLLECTED TODAY (₹0 DEFERRED)" : "AMOUNT COLLECTED TODAY (₹)"}
                  </label>
                  <input
                    type="number"
                    value={amountPaidToday}
                    onChange={(e) => setAmountPaidToday(e.target.value)}
                    disabled={paymentType === "PAY_LATER"}
                    className={`w-full border rounded-2xl p-3 outline-none font-extrabold font-mono text-sm ${
                      paymentType === "PAY_LATER"
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
                        : "bg-slate-50 text-slate-900 border-slate-200 focus:border-cyan-500"
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block uppercase text-[10px]">OUTSTANDING DUES RESULT</label>
                  <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-3 text-amber-900 font-black font-mono text-sm flex items-center justify-between">
                    <span>₹{calculatedNewDues}</span>
                    <span className="text-[10px] uppercase font-mono bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                      {calculatedNewDues === 0 ? "Fully Paid" : "Dues Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {/* PAYMENT MODE SELECTOR (Only if collecting money today) */}
              {parseFloat(amountPaidToday) > 0 && (
                <div className="space-y-3">
                  <label className="text-slate-500 font-bold block">PAYMENT MODE FOR TODAY'S DEPOSIT</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "UPI", label: "Cash (Full Cash)" },
                      { id: "Online", label: "Online / UPI" },
                      { id: "Split", label: "Split (Cash + Online)" }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPaymentMode(mode.id)}
                        className={`p-3 rounded-2xl border font-bold text-xs transition-all text-center cursor-pointer ${
                          paymentMode === mode.id
                            ? "bg-cyan-50 border-cyan-500 text-cyan-900 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  {/* Split Cash + Online Breakdown */}
                  {paymentMode === "Split" && (
                    <div className="grid grid-cols-2 gap-3 bg-cyan-50/60 p-4 rounded-2xl border border-cyan-200 animate-fadeIn">
                      <div>
                        <label className="text-slate-600 font-bold mb-1 block">Cash Amount (₹)</label>
                        <input
                          type="number"
                          value={cashAmount}
                          onChange={(e) => handleCashAmountChange(e.target.value)}
                          className="w-full bg-white border border-cyan-300 rounded-xl p-2.5 text-slate-900 font-bold font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 font-bold mb-1 block">Online Amount (₹)</label>
                        <input
                          type="number"
                          value={onlineAmount}
                          onChange={(e) => handleOnlineAmountChange(e.target.value)}
                          className="w-full bg-white border border-cyan-300 rounded-xl p-2.5 text-slate-900 font-bold font-mono outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DATE PAID & NOTES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">DATE PAID</label>
                  <input
                    type="date"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">NOTES / REMARKS</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional transaction remarks..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-medium"
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-cyan-400" />
                <span>
                  {paymentType === "FULL" && "Record Full Payment & Activate Plan"}
                  {paymentType === "PARTIAL" && `Record Partial Payment (₹${amountPaidToday}) & Set ₹${calculatedNewDues} Dues`}
                  {paymentType === "PAY_LATER" && `Activate Plan with Pay Later (₹${calculatedNewDues} Overdue Dues)`}
                  {paymentType === "COLLECT_DUES" && `Collect ₹${amountPaidToday} Dues (${calculatedNewDues} Remaining)`}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* 🌟 BOTTOM FULL-WIDTH SECTION: PAYMENTS LEDGER HISTORY 🌟 */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-600" />
                <span>Payments Ledger History</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">Complete record of verified student payments and revenue logs</p>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setLedgerFilter("ALL")}
                className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${ledgerFilter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                All History
              </button>
              <button
                type="button"
                onClick={() => setLedgerFilter("SELECTED")}
                className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${ledgerFilter === "SELECTED" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                {selectedMemberObj ? selectedMemberObj.full_name : "Selected Member"}
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="p-3.5">DATE PAID</th>
                  <th className="p-3.5">INVOICE</th>
                  <th className="p-3.5">MEMBER</th>
                  <th className="p-3.5">AMOUNT</th>
                  <th className="p-3.5">MODE</th>
                  <th className="p-3.5">TRANSACTION DETAILS / NOTES</th>
                  <th className="p-3.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const displayPayments = ledgerFilter === "SELECTED" && selectedMemberId
                    ? payments.filter(p => p.member_id === selectedMemberId)
                    : payments;

                  if (displayPayments.length === 0) {
                    return (
                      <tr><td colSpan="7" className="p-6 text-center text-slate-400 italic">No payments found in ledger for this filter.</td></tr>
                    );
                  }

                  return displayPayments.map((p) => (
                    <tr key={p.id} className={`hover:bg-slate-50/80 ${p.member_id === selectedMemberId ? "bg-cyan-50/30 font-semibold" : ""}`}>
                      <td className="p-3.5 font-mono text-slate-500 text-[11px] font-bold">{p.paid_at ? p.paid_at.substring(0, 10) : "N/A"}</td>
                      <td className="p-3.5 font-mono text-cyan-700 font-bold">{p.invoice_id}</td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleSelectStudentForPaymentEntry(p.member_id, p.member_name)}
                          className="font-extrabold text-slate-900 hover:text-cyan-600 flex items-center gap-2 group transition-colors text-left cursor-pointer"
                          title="Click to Preselect Student for Payment Entry"
                        >
                          <span>{p.member_name || "Student"}</span>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 opacity-80 group-hover:opacity-100 transition-opacity">Select</span>
                        </button>
                      </td>
                      <td className="p-3.5 font-mono font-black text-emerald-600 text-sm">₹{p.amount}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 text-[10px] font-bold border border-cyan-200">
                          {p.payment_mode}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 text-[11px] font-medium max-w-xs truncate">{p.notes || "Subscription payment"}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenManageStudent(p.member_id, p.member_name)}
                            className="p-1.5 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            title="Edit Student Profile"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePaymentRecord(p.id)}
                            className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Delete Payment Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🌟 SUCCESS RECEIPT MODAL 🌟 */}
        {successPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-popIn">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Payment Verified & Saved!</h3>
                <p className="text-xs text-slate-500 font-medium">Invoice ID: <strong className="font-mono text-cyan-600">{successPayment.invoice_id}</strong></p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 font-bold">
                  <span>Student Name:</span>
                  <span className="text-slate-900">{successPayment.member_name}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-bold">
                  <span>Amount Paid Today:</span>
                  <span className="text-emerald-600 font-mono text-sm font-black">₹{successPayment.amount}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-bold">
                  <span>Payment Scheme:</span>
                  <span className="text-cyan-700">{paymentType}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSuccessPayment(null)}
                  className="flex-1 p-3 rounded-2xl border border-slate-200 font-extrabold text-xs text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <a
                  href={`/invoice?id=${successPayment.invoice_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 p-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/25"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 🌟 EDIT STUDENT MODAL 🌟 */}
        {manageStudentModalOpen && managedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
            <form onSubmit={handleSaveStudentEdit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-popIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Quick Edit Student Profile</h3>
                <button type="button" onClick={() => setManageStudentModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Full Name</label>
                  <input
                    type="text"
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Mobile Number</label>
                  <input
                    type="text"
                    value={editFormData.mobile}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Shift Plan</label>
                  <select
                    value={editFormData.shift}
                    onChange={(e) => setEditFormData({ ...editFormData, shift: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-bold"
                  >
                    <option value="Full Day">Full Day Shift (24 hrs)</option>
                    <option value="Morning">Morning Shift (06:00 AM - 02:00 PM)</option>
                    <option value="Evening">Evening Shift (06:00 PM - 12:00 AM)</option>
                    <option value="Night">Night Shift (10:00 PM - 06:00 AM)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Seat Number</label>
                  <input
                    type="text"
                    value={editFormData.seat_no}
                    onChange={(e) => setEditFormData({ ...editFormData, seat_no: e.target.value })}
                    placeholder="e.g. SEAT-005"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Admission / Joining Date</label>
                  <input
                    type="date"
                    value={editFormData.joining_date}
                    onChange={(e) => setEditFormData({ ...editFormData, joining_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Subscription Expiry Date</label>
                  <input
                    type="date"
                    value={editFormData.subscription_end_date}
                    onChange={(e) => setEditFormData({ ...editFormData, subscription_end_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Base Plan Price (₹)</label>
                  <input
                    type="number"
                    value={editFormData.plan_amount}
                    onChange={(e) => setEditFormData({ ...editFormData, plan_amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Outstanding Dues (₹)</label>
                  <input
                    type="number"
                    value={editFormData.outstanding_dues}
                    onChange={(e) => setEditFormData({ ...editFormData, outstanding_dues: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-bold font-mono text-rose-600"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setManageStudentModalOpen(false)} className="flex-1 p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="flex-1 p-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-xs font-bold text-white shadow-lg shadow-cyan-500/25">Save Changes</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function RecordPaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-slate-500">Loading Record Payment Hub...</div>}>
      <RecordPaymentContent />
    </Suspense>
  );
}

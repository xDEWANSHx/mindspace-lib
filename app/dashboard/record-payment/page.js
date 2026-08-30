"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
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
  HelpCircle,
  Lock
} from "lucide-react";
import {
  fetchMembers,
  fetchPayments,
  recordPayment,
  deletePayment,
  updateMember,
  formatDate,
  addOneMonth,
  subtractOneMonth,
  addDaysToDate,
  getMemberSubscriptionDates
} from "@/lib/adminService";
import { formatWhatsAppMessage, openWhatsAppDirectMessage } from "@/lib/whatsappTemplates";

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
    plan_amount: 1100,
    outstanding_dues: 0,
    payment_status: "PAID"
  });

  // Form State
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [paymentType, setPaymentType] = useState("FULL"); // FULL | PARTIAL | PAY_LATER | COLLECT_DUES
  const [planFee, setPlanFee] = useState(1100); // Base Plan Cost
  const [discountAmount, setDiscountAmount] = useState(0); // Current Month Discount
  const [amountPaidToday, setAmountPaidToday] = useState(1100); // Actual Cash/Online collected today
  const [paymentMode, setPaymentMode] = useState("UPI"); // Cash | Online | Split
  const [cashAmount, setCashAmount] = useState(500);
  const [onlineAmount, setOnlineAmount] = useState(500);
  const [durationTab, setDurationTab] = useState("1M"); // 1M | 3M | 6M | 12M | CUSTOM
  const [extendDays, setExtendDays] = useState(30);
  const [notes, setNotes] = useState("");
  const [paidDate, setPaidDate] = useState(() => formatDate(new Date()));
  const [promisedDueDate, setPromisedDueDate] = useState("");
  const [successPayment, setSuccessPayment] = useState(null);

  // Active Student Advance Renewal Confirmation Modal State
  const [activeConfirmModalOpen, setActiveConfirmModalOpen] = useState(false);
  const [pendingPaymentPayload, setPendingPaymentPayload] = useState(null);

  // Locker Add-On Option
  const [includeLocker, setIncludeLocker] = useState(false);
  const [lockerFee, setLockerFee] = useState(50);

  useEffect(() => {
    setPaidDate(new Date().toISOString().substring(0, 10));
  }, []);

  const selectedMemberObj = members.find(m => m.id === selectedMemberId);

  // Auto-sync Promised Due Date when member changes
  useEffect(() => {
    if (selectedMemberObj) {
      if (selectedMemberObj.due_date || selectedMemberObj.dues_due_date) {
        setPromisedDueDate(selectedMemberObj.due_date || selectedMemberObj.dues_due_date);
      } else {
        setPromisedDueDate("");
      }
    }
  }, [selectedMemberId, selectedMemberObj]);

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

  useEffect(() => {
    let storedPlanAmount = parseFloat(selectedMemberObj?.plan_amount || 1100);
    if (selectedMemberObj?.shift === "Full Day" && storedPlanAmount === 600) {
      storedPlanAmount = 1100;
    }
    const fee = parseFloat(lockerFee || 50);
    const baseShiftRate = selectedMemberObj?.has_locker ? Math.max(0, storedPlanAmount - fee) : storedPlanAmount;
    const monthlyRate = includeLocker ? (baseShiftRate + fee) : baseShiftRate;

    if (durationTab === "1M") {
      setPlanFee(monthlyRate);
    } else if (durationTab === "3M") {
      setPlanFee(monthlyRate * 3);
    } else if (durationTab === "6M") {
      setPlanFee(monthlyRate * 6);
    } else if (durationTab === "12M") {
      setPlanFee(monthlyRate * 12);
    }
    // In CUSTOM mode, planFee is managed directly by Admin's manual Net Payable input!
  }, [durationTab, selectedMemberId, selectedMemberObj?.plan_amount, selectedMemberObj?.shift, selectedMemberObj?.has_locker, includeLocker, lockerFee]);

  const parsedDiscount = Math.max(0, parseFloat(discountAmount || 0));
  const effectivePayable = Math.max(0, parseFloat(planFee || 0) - parsedDiscount);

  // Sync payment type & discount to amount paid today
  useEffect(() => {
    const pDisc = Math.max(0, parseFloat(discountAmount || 0));
    const netPay = Math.max(0, parseFloat(planFee || 0) - pDisc);

    if (paymentType === "FULL") {
      setAmountPaidToday(netPay);
    } else if (paymentType === "PAY_LATER") {
      setAmountPaidToday(0);
    } else if (paymentType === "PARTIAL") {
      setAmountPaidToday(Math.round(netPay / 2));
    } else if (paymentType === "COLLECT_DUES") {
      setAmountPaidToday(selectedMemberObj?.outstanding_dues || 0);
      setDiscountAmount(0);
    }
  }, [paymentType, planFee, discountAmount, effectivePayable, selectedMemberObj?.outstanding_dues]);

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
            setPlanFee(m.plan_amount || 1100);
            setAmountPaidToday(m.plan_amount || 1100);
          }
        }
      } else if (mList.length > 0) {
        // Sort mList by newest first so newly admitted student is selected by default
        const sortedList = [...mList].sort((a, b) => {
          const timeA = new Date(a.created_at || a.joining_date || 0).getTime();
          const timeB = new Date(b.created_at || b.joining_date || 0).getTime();
          if (timeA !== timeB) return timeB - timeA;
          const idA = parseInt(String(a.permanent_id || '').replace(/\D/g, '')) || 0;
          const idB = parseInt(String(b.permanent_id || '').replace(/\D/g, '')) || 0;
          return idB - idA;
        });
        const topMem = sortedList[0];
        setSelectedMemberId(topMem.id);
        setPlanFee(topMem.plan_amount || 1100);
        setAmountPaidToday(topMem.plan_amount || 1100);
      }
    }
    load();
  }, [activeBranch, queryMemberId]);

  const [joiningDate, setJoiningDate] = useState(formatDate(new Date()));
  const [overrideExpiryDate, setOverrideExpiryDate] = useState("");

  const getDefaultSubStartDate = (m) => {
    if (!m) return paidDate || formatDate(new Date());
    const hasValidSub = m.subscription_end_date && !String(m.subscription_end_date).startsWith("1970");
    if (hasValidSub) {
      return addDaysToDate(m.subscription_end_date, 1);
    }
    return m.joining_date || paidDate || formatDate(new Date());
  };

  // Auto-sync locker/date state when student selected (Runs ONLY when selectedMemberId changes!)
  useEffect(() => {
    if (selectedMemberObj) {
      setIncludeLocker(!!selectedMemberObj.has_locker);
      setOverrideExpiryDate("");

      if (selectedMemberObj.outstanding_dues > 0) {
        setPaymentType("COLLECT_DUES");
        setAmountPaidToday(selectedMemberObj.outstanding_dues);
        setJoiningDate(selectedMemberObj.joining_date || paidDate || formatDate(new Date()));
      } else {
        setPaymentType("FULL");
        setPlanFee(selectedMemberObj.plan_amount || 1100);
        setAmountPaidToday(selectedMemberObj.plan_amount || 1100);
        setJoiningDate(getDefaultSubStartDate(selectedMemberObj));
      }
    }
  }, [selectedMemberId]);

  // Adjust joining date when switching paymentType
  useEffect(() => {
    if (selectedMemberObj && paymentType !== "COLLECT_DUES") {
      setJoiningDate(getDefaultSubStartDate(selectedMemberObj));
    }
  }, [paymentType]);

  // Auto-calculated Expiry Date (Joining Date + Duration Days)
  const calculatedExpiryDate = useMemo(() => {
    if (!joiningDate) return "";
    if (parseInt(extendDays) === 30 || extendDays === "30") {
      return addOneMonth(joiningDate);
    }
    return addDaysToDate(joiningDate, extendDays);
  }, [joiningDate, extendDays]);

  const finalExpiryDate = overrideExpiryDate || calculatedExpiryDate;

  // Auto-calculated Dues
  const currDues = selectedMemberObj?.outstanding_dues || 0;
  let calculatedNewDues = 0;
  if (paymentType === "FULL") {
    calculatedNewDues = 0;
  } else if (paymentType === "PARTIAL") {
    calculatedNewDues = Math.max(0, Math.round(effectivePayable - parseFloat(amountPaidToday || 0)));
  } else if (paymentType === "PAY_LATER") {
    calculatedNewDues = Math.round(effectivePayable);
  } else if (paymentType === "COLLECT_DUES") {
    calculatedNewDues = Math.max(0, Math.round(currDues - parseFloat(amountPaidToday || 0)));
  }

  // Pending Dues Warning & Block Check
  const hasPendingDues = currDues > 0;
  const isTryingNextMonthPayment = paymentType === "FULL" || paymentType === "PARTIAL" || paymentType === "PAY_LATER";
  const isDuesBlocked = hasPendingDues && isTryingNextMonthPayment;

  const executePaymentRecord = async (payload) => {
    if (!selectedMemberObj) return;

    const p = await recordPayment({
      member_id: selectedMemberObj.id,
      member_name: selectedMemberObj.full_name,
      amount: payload.parsedPaidToday,
      branch: activeBranch,
      payment_mode: payload.parsedPaidToday === 0 ? "Deferred" : paymentMode,
      cash_amount: payload.cPart,
      online_amount: payload.oPart,
      notes: payload.finalNote + payload.lockerNoteTag,
      is_renewal: payload.isRenewalAction,
      extend_days: payload.extendDays,
      start_date: payload.joiningDate,
      end_date: payload.finalExpiryDate || addOneMonth(payload.joiningDate),
      new_outstanding_dues: payload.calculatedNewDues,
      dues_due_date: payload.calculatedNewDues > 0 ? payload.promisedDueDate : null,
      has_locker: payload.includeLocker,
      paid_at: payload.paidDate
    });

    setSuccessPayment(p);
    
    // Reset input fields & switch payment scheme back to FULL if dues fully cleared
    setNotes("");
    setDiscountAmount(0);
    setIncludeLocker(false);
    if (payload.calculatedNewDues === 0) {
      setPaymentType("FULL");
    }

    // Refresh live members and payments directly from database
    const [mList, pList] = await Promise.all([
      fetchMembers(activeBranch),
      fetchPayments(activeBranch)
    ]);
    setMembers(mList);
    setPayments(pList);
    setActiveConfirmModalOpen(false);
    setPendingPaymentPayload(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMemberObj) return;

    if (isDuesBlocked) {
      alert(`Student ${selectedMemberObj.full_name} has pending dues of ₹${currDues}. You cannot record a next month subscription payment until previous dues are cleared! Please use 'Collect Dues' scheme first.`);
      return;
    }

    const parsedPaidToday = parseFloat(amountPaidToday) || 0;
    const parsedPlanFee = parseFloat(planFee) || 0;


    const cPart = paymentMode === "Cash" ? parsedPaidToday : (paymentMode === "Split" ? (parseFloat(cashAmount) || 0) : 0);
    const oPart = (paymentMode === "Online" || paymentMode === "UPI") ? parsedPaidToday : (paymentMode === "Split" ? (parseFloat(onlineAmount) || 0) : 0);

    if (paymentMode === "Split" && parsedPaidToday > 0 && (cPart + oPart !== parsedPaidToday)) {
      alert(`Split payment total (Cash ₹${cPart} + Online ₹${oPart} = ₹${cPart + oPart}) does not equal total collected ₹${parsedPaidToday}`);
      return;
    }

    // ₹0 Collect Dues = No money exchanged, just update Promised Due Date — no payment record
    if (paymentType === "COLLECT_DUES" && parsedPaidToday === 0) {
      if (!promisedDueDate) {
        alert("Please set a Promised Payment Due Date before saving this Pay Later commitment.");
        return;
      }
      await updateMember(selectedMemberObj.id, {
        due_date: promisedDueDate,
        dues_due_date: promisedDueDate
      });
      const [mListZ, pListZ] = await Promise.all([
        fetchMembers(activeBranch),
        fetchPayments(activeBranch)
      ]);
      setMembers(mListZ);
      setPayments(pListZ);
      // No payment record — just a silent promised date save
      return;
    }

    let defaultNote = "";
    let isRenewalAction = false;

    if (paymentType === "FULL") {
      defaultNote = `Full Subscription Renewal (${extendDays} days)`;
      if (parsedDiscount > 0) defaultNote += ` [Discount Given: ₹${parsedDiscount}]`;
      isRenewalAction = true;
    } else if (paymentType === "PARTIAL") {
      defaultNote = `Partial Payment (Paid ₹${parsedPaidToday} of ₹${effectivePayable}, ₹${calculatedNewDues} Dues Pending)`;
      if (parsedDiscount > 0) defaultNote += ` [Discount Given: ₹${parsedDiscount}]`;
      isRenewalAction = true;
    } else if (paymentType === "PAY_LATER") {
      defaultNote = `Pay Later Deferred Activation (${extendDays} days plan, ₹${calculatedNewDues} Total Overdue Dues)`;
      if (parsedDiscount > 0) defaultNote += ` [Discount Given: ₹${parsedDiscount}]`;
      isRenewalAction = true;
    } else if (paymentType === "COLLECT_DUES") {
      defaultNote = `Pending Dues Recovery (Paid ₹${parsedPaidToday}, ₹${calculatedNewDues} Remaining Dues)`;
      isRenewalAction = false;
    }

    let finalNote = notes ? `${notes} - ${defaultNote}` : defaultNote;
    if (paymentMode === "Split" && parsedPaidToday > 0) {
      finalNote += ` (Split: Cash ₹${cPart}, Online ₹${oPart})`;
    }

    const lockerNoteTag = includeLocker
      ? (selectedMemberObj.has_locker ? "" : " [+ Locker Facility Added]")
      : (selectedMemberObj.has_locker ? " [- Locker Facility Discontinued]" : "");

    const todayStr = formatDate(new Date());
    const isCurrentlyActive = selectedMemberObj.subscription_end_date && selectedMemberObj.subscription_end_date >= todayStr;

    const payload = {
      parsedPaidToday,
      cPart,
      oPart,
      finalNote,
      lockerNoteTag,
      isRenewalAction,
      extendDays,
      joiningDate,
      finalExpiryDate,
      calculatedNewDues,
      promisedDueDate,
      includeLocker,
      paidDate,
      currentExpiry: selectedMemberObj.subscription_end_date
    };

    // If student is currently active and user is performing a renewal action, prompt for confirmation
    if (isRenewalAction && isCurrentlyActive) {
      setPendingPaymentPayload(payload);
      setActiveConfirmModalOpen(true);
      return;
    }

    await executePaymentRecord(payload);
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
        setPlanFee(target.plan_amount || 1100);
        setAmountPaidToday(target.plan_amount || 1100);
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
      const joinStr = target.joining_date || formatDate(new Date());
      const dates = getMemberSubscriptionDates(target, payments);
      const subStartVal = dates.subStart !== "--" ? dates.subStart : "";
      const subExpiryVal = (target.subscription_end_date && !String(target.subscription_end_date).startsWith("1970")) ? target.subscription_end_date : (dates.subExpiry !== "--" ? dates.subExpiry : "");

      setEditFormData({
        full_name: target.full_name || "",
        mobile: target.mobile || "",
        shift: target.shift || "Full Day",
        seat_no: target.seat_no || "",
        joining_date: joinStr,
        sub_start_date: subStartVal,
        subscription_end_date: subExpiryVal,
        plan_amount: target.plan_amount || 1100,
        outstanding_dues: target.outstanding_dues || 0,
        payment_status: target.outstanding_dues > 0 ? (target.outstanding_dues < (target.plan_amount || 1100) ? "PARTIAL" : "UNPAID") : "PAID"
      });
      setManageStudentModalOpen(true);
    } else {
      alert(`Student details for "${fallbackName || 'Selected Student'}" could not be found.`);
    }
  };

  const handleSaveStudentEdit = async (e) => {
    e.preventDefault();
    if (!managedStudent) return;

    let finalPlanAmount = parseFloat(editFormData.plan_amount || 1100);
    if (editFormData.shift === "Full Day" && (finalPlanAmount === 600 || !editFormData.plan_amount)) {
      finalPlanAmount = 1100;
    }

    const updatedDues = parseFloat(editFormData.outstanding_dues || 0);
    const joinStr = editFormData.joining_date || managedStudent.joining_date || formatDate(new Date());
    const finalSubEnd = editFormData.subscription_end_date || (editFormData.sub_start_date ? addOneMonth(editFormData.sub_start_date) : null);

    await updateMember(managedStudent.id, {
      full_name: editFormData.full_name,
      mobile: editFormData.mobile,
      shift: editFormData.shift,
      seat_no: editFormData.seat_no ? editFormData.seat_no : null,
      joining_date: joinStr,
      subscription_end_date: finalSubEnd,
      plan_amount: finalPlanAmount,
      outstanding_dues: updatedDues,
      payment_status: updatedDues === 0 ? "PAID" : (updatedDues < finalPlanAmount ? "PARTIAL" : "UNPAID")
    });

    const memPayments = payments.filter(p =>
      p.member_id === managedStudent.id ||
      p.member_id === managedStudent.permanent_id ||
      p.member_id === managedStudent.student_no ||
      (p.member_name && managedStudent.full_name && p.member_name.trim().toLowerCase() === managedStudent.full_name.trim().toLowerCase())
    );
    if (memPayments.length > 0) {
      memPayments.sort((a, b) => {
        const tA = a.paid_at ? new Date(a.paid_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
        const tB = b.paid_at ? new Date(b.paid_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
        return tB - tA;
      });
      const latestP = memPayments[0];
      let updatedNotes = latestP.notes || "";
      if (editFormData.sub_start_date) {
        if (updatedNotes.includes("Start Date:")) {
          updatedNotes = updatedNotes.replace(/Start Date:\s*\d{4}-\d{2}-\d{2}/i, `Start Date: ${editFormData.sub_start_date}`);
        } else {
          updatedNotes += ` — Start Date: ${editFormData.sub_start_date}`;
        }
      }
      if (finalSubEnd && !String(finalSubEnd).startsWith("1970")) {
        if (updatedNotes.includes("Expiry:")) {
          updatedNotes = updatedNotes.replace(/Expiry:\s*\d{4}-\d{2}-\d{2}/i, `Expiry: ${finalSubEnd}`);
        } else {
          updatedNotes += `, Expiry: ${finalSubEnd}`;
        }
      }
      try {
        await supabase.from('payments').update({
          member_name: editFormData.full_name || latestP.member_name,
          notes: updatedNotes
        }).eq('id', latestP.id);
      } catch (err) {}
    }

    setManageStudentModalOpen(false);
    const [mList, pList] = await Promise.all([
      fetchMembers(activeBranch),
      fetchPayments(activeBranch)
    ]);
    setMembers(mList);
    setPayments(pList);

    if (selectedMemberId === managedStudent.id) {
      const lockerAddOn = includeLocker ? parseFloat(lockerFee || 50) : 0;
      setPlanFee(finalPlanAmount + lockerAddOn);
      setAmountPaidToday(finalPlanAmount + lockerAddOn);
    }

    alert(`Student profile for ${editFormData.full_name} updated successfully across database!`);
  };

  const handleDeletePaymentRecord = async (paymentId) => {
    if (!confirm("Are you sure you want to delete this payment record? The amount will be deducted from total revenue, and student dues/status will be restored.")) return;
    await deletePayment(paymentId);
    const [mList, pList] = await Promise.all([
      fetchMembers(activeBranch),
      fetchPayments(activeBranch)
    ]);
    setMembers(mList);
    setPayments(pList);
  };

  // Helper for Student Directory Badge
  const getMemberBadgeInfo = (m) => {
    if (!m) return { label: "Unknown", color: "bg-slate-100 text-slate-600 border border-slate-200" };
    if (m.status === 'LEFT' || m.left_at || m.is_active === false) {
      return { label: "Left", color: "bg-slate-100 text-slate-600 border border-slate-200" };
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const dueDateStr = m.due_date || m.dues_due_date;
    let isDueDatePassed = false;
    let hasDueDate = false;
    if (dueDateStr) {
      const parts = String(dueDateStr).substring(0, 10).split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0])) {
        hasDueDate = true;
        const promisedDate = new Date(parts[0], parts[1] - 1, parts[2]);
        promisedDate.setHours(0, 0, 0, 0);
        if (now > promisedDate) {
          isDueDatePassed = true;
        }
      }
    }

    const hasValidSub = m.subscription_end_date && !String(m.subscription_end_date).startsWith("1970");
    const end = hasValidSub ? new Date(m.subscription_end_date) : null;
    if (end) end.setHours(0, 0, 0, 0);
    const diffDays = end ? Math.ceil((end - now) / (1000 * 60 * 60 * 24)) : 999;

    // 1. Paid subscription expired -> RED
    if (hasValidSub && diffDays < 0) {
      return { label: `Overdue (${Math.abs(diffDays)}d)`, color: "bg-rose-100 text-rose-800 border border-rose-300 font-extrabold" };
    }
    if (m.outstanding_dues > 0 && isDueDatePassed) {
      return { label: `₹${m.outstanding_dues} Overdue`, color: "bg-rose-100 text-rose-800 border border-rose-300 font-extrabold" };
    }

    // 2. Unpaid admission dues check (Day 0 = Pending, Day 1+ = Overdue)
    if (m.outstanding_dues > 0) {
      if (!hasValidSub) {
        const joinStr = m.joining_date || (m.created_at ? m.created_at.substring(0, 10) : formatDate(now));
        const jParts = String(joinStr).substring(0, 10).split('-').map(Number);
        if (jParts.length === 3 && !isNaN(jParts[0])) {
          const joinDate = new Date(jParts[0], jParts[1] - 1, jParts[2]);
          joinDate.setHours(0, 0, 0, 0);
          const daysSince = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));

          if (daysSince >= 1 && !hasDueDate) {
            return { label: `Overdue (${daysSince}d)`, color: "bg-rose-100 text-rose-800 border border-rose-300 font-extrabold" };
          }
        }
      }
      return { label: `₹${m.outstanding_dues} Pending`, color: "bg-amber-100 text-amber-900 border border-amber-300 font-extrabold" };
    }

    // 3. Due soon -> AMBER
    if (hasValidSub && diffDays >= 0 && diffDays <= 3) {
      return { label: `Due Soon (${diffDays}d)`, color: "bg-amber-100 text-amber-800 border border-amber-300 font-extrabold" };
    }

    // 4. Paid active -> GREEN
    return { label: "Paid (Active)", color: "bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold" };
  };

  // Filter Members in Students Directory
  const filteredDirectoryMembers = members.filter(m => {
    const matchesSearch = !directorySearch.trim() || (
      m.full_name?.toLowerCase().includes(directorySearch.toLowerCase()) ||
      m.permanent_id?.toLowerCase().includes(directorySearch.toLowerCase()) ||
      m.mobile?.includes(directorySearch)
    );
    if (!matchesSearch) return false;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const createdDate = new Date(m.created_at || m.joining_date || now);
    createdDate.setHours(0, 0, 0, 0);
    const daysSinceAdmission = Math.max(0, Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)));

    const dueDate = m.due_date ? new Date(m.due_date) : null;
    if (dueDate) dueDate.setHours(0, 0, 0, 0);
    const isDueDatePassed = dueDate ? (now > dueDate) : false;

    const isUnpaidOverdue = m.outstanding_dues > 0 && (daysSinceAdmission >= 1 || isDueDatePassed);

    if (directoryFilter === "PAID") {
      return m.outstanding_dues === 0;
    }
    if (directoryFilter === "PARTIAL") {
      return m.outstanding_dues > 0 && m.outstanding_dues < (m.plan_amount || 1100);
    }
    if (directoryFilter === "PAY_LATER" || directoryFilter === "PENDING") {
      return m.outstanding_dues > 0 && !isUnpaidOverdue;
    }
    if (directoryFilter === "OVERDUE") {
      if (!m.subscription_end_date) return isUnpaidOverdue;
      const end = new Date(m.subscription_end_date);
      end.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return diffDays < 0 || isUnpaidOverdue;
    }
    if (directoryFilter === "DUE_SOON") {
      if (!m.subscription_end_date) return false;
      const end = new Date(m.subscription_end_date);
      end.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    }
    return true;
  }).sort((a, b) => {
    // Newest admissions first
    const timeA = new Date(a.created_at || a.joining_date || 0).getTime();
    const timeB = new Date(b.created_at || b.joining_date || 0).getTime();
    if (timeA !== timeB) return timeB - timeA;

    const idA = parseInt(String(a.permanent_id || '').replace(/\D/g, '')) || 0;
    const idB = parseInt(String(b.permanent_id || '').replace(/\D/g, '')) || 0;
    return idB - idA;
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
                        ? "bg-cyan-600 text-white shadow-sm"
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
                    const badgeInfo = getMemberBadgeInfo(m);
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
                            setPlanFee(m.plan_amount || 1100);
                            setAmountPaidToday(m.plan_amount || 1100);
                          }
                        }}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-cyan-50/90 border-cyan-400 shadow-sm ring-1 ring-cyan-400/50"
                            : "bg-white border-slate-200/80 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${m.outstanding_dues > 0 ? "bg-amber-500" : "bg-emerald-500"}`} />
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs">{m.full_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {m.permanent_id || "STUDENT"} {m.seat_no ? `• ${m.seat_no}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${badgeInfo.color}`}>
                            {badgeInfo.label}
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
              <div className="bg-gradient-to-br from-white via-cyan-50/20 to-slate-50 border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4 animate-popIn">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-cyan-500/20">
                      {selectedMemberObj.full_name?.charAt(0)?.toUpperCase() || "S"}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{selectedMemberObj.full_name}</h4>
                      <p className="text-[11px] text-cyan-700 font-mono font-extrabold flex items-center gap-1.5 mt-0.5">
                        <span>{selectedMemberObj.permanent_id || "STUDENT ID"}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 font-sans font-medium">Mob: {selectedMemberObj.mobile || "N/A"}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenManageStudent(selectedMemberObj.id, selectedMemberObj.full_name)}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300 transition-all shadow-2xs cursor-pointer"
                    title="Edit Profile"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[9px] uppercase font-mono font-extrabold text-slate-400 block tracking-wider">SHIFT</span>
                    <span className="text-slate-900 font-extrabold text-xs">{selectedMemberObj.shift || "Full Day"}</span>
                  </div>
                  <div className="bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[9px] uppercase font-mono font-extrabold text-slate-400 block tracking-wider">SEAT ASSIGNED</span>
                    <span className="text-cyan-700 font-mono font-extrabold text-xs">{selectedMemberObj.seat_no || "Unassigned"}</span>
                  </div>
                  <div className="bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] uppercase font-mono font-extrabold text-slate-400 block tracking-wider">EXPIRY / VALID TILL</span>
                      <span className="text-slate-800 font-mono font-bold text-xs">{(selectedMemberObj.subscription_end_date && !String(selectedMemberObj.subscription_end_date).startsWith("1970")) ? selectedMemberObj.subscription_end_date : "--"}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${getMemberBadgeInfo(selectedMemberObj).color}`}>
                      {getMemberBadgeInfo(selectedMemberObj).label}
                    </span>
                  </div>

                  {selectedMemberObj.outstanding_dues > 0 && (
                    <div className="bg-amber-50/90 backdrop-blur-xs p-3 rounded-2xl border border-amber-200/90 shadow-2xs col-span-2 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] uppercase font-mono font-extrabold text-amber-600 block tracking-wider">PROMISED PAYMENT DUE DATE</span>
                        <span className="text-amber-950 font-mono font-black text-xs">
                          {selectedMemberObj.due_date || selectedMemberObj.dues_due_date || "Not Set"}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">
                        ₹{selectedMemberObj.outstanding_dues} Dues
                      </span>
                    </div>
                  )}
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
              
              {/* PAYMENT TYPE MODE SELECTOR: FULL / PARTIAL / PAY LATER / DUES */}
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
                            ? "bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/20"
                            : `bg-slate-50 border-slate-200 text-slate-700 ${scheme.bg}`
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <IconComp className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                        </div>
                        <div className="mt-2">
                          <p className="font-extrabold text-xs">{scheme.label}</p>
                          <p className={`text-[9px] font-medium ${isActive ? "text-cyan-100" : "text-slate-400"}`}>{scheme.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PENDING DUES BLOCK WARNING BANNER */}
              {isDuesBlocked && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 flex items-start gap-3.5 text-xs text-rose-900 shadow-sm animate-fadeIn">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-black text-rose-950 text-sm">
                      Pending Dues Clear Required!
                    </h4>
                    <p className="text-rose-800 font-medium leading-relaxed">
                      Student <strong className="text-rose-950">{selectedMemberObj?.full_name}</strong> has previous unpaid dues of <strong className="font-mono text-rose-950 font-black">₹{currDues}</strong>.
                      You cannot record or activate next month&apos;s subscription payment until previous dues are cleared!
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setPaymentType("COLLECT_DUES")}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Click Here to Collect ₹{currDues} Dues First</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PRICING & PLAN DURATION DETAILS */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Plan Duration & Custom Pricing</span>
                  </span>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-500 font-medium">Student Rate: ₹{selectedMemberObj?.plan_amount || 1100}/mo</span>
                    <span>•</span>
                    <span className="font-black text-slate-900">Base Plan: ₹{planFee}</span>
                  </div>
                </div>

                {/* PLAN START DATE & EDITABLE EXPIRY DATE */}
                <div className="bg-slate-100/90 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. Subscription Start Date */}
                    <div>
                      <label className="text-slate-700 font-extrabold text-xs mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                        <span>SUBSCRIPTION START DATE</span>
                      </label>
                      <input
                        type="date"
                        value={joiningDate}
                        onChange={(e) => {
                          setJoiningDate(e.target.value);
                          setOverrideExpiryDate("");
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 font-mono outline-none focus:border-cyan-600"
                      />
                    </div>

                    {/* 2. Editable Expiry Date */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 font-extrabold text-xs flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>EXPIRY DATE</span>
                        </label>
                        {overrideExpiryDate && (
                          <button
                            type="button"
                            onClick={() => setOverrideExpiryDate("")}
                            className="text-[10px] text-cyan-600 font-extrabold hover:underline cursor-pointer"
                          >
                            Reset Auto
                          </button>
                        )}
                      </div>
                      <input
                        type="date"
                        value={finalExpiryDate}
                        onChange={(e) => setOverrideExpiryDate(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-xs font-black font-mono outline-none transition-all ${
                          overrideExpiryDate
                            ? "bg-purple-50 border-purple-400 text-purple-950 shadow-inner"
                            : "bg-emerald-50 border-emerald-300 text-emerald-950"
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>
                      {overrideExpiryDate ? "✏️ Custom Expiry Date Set Manually" : "✨ Auto-calculated (Month-to-Month Cycle)"}
                    </span>
                    <span className="font-mono text-cyan-800 font-extrabold">
                      Active Period: {joiningDate} → {finalExpiryDate}
                    </span>
                  </div>
                </div>

                {/* Duration Tabs */}
                <div>
                  <label className="text-slate-500 font-bold mb-1.5 block">SELECT MEMBERSHIP DURATION</label>
                  <div className="grid grid-cols-5 gap-2">
                    {["1M", "3M", "6M", "12M", "CUSTOM"].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => {
                          setDurationTab(tab);
                          setOverrideExpiryDate("");
                          if (paymentType === "COLLECT_DUES") {
                            setPaymentType("FULL");
                          }
                          if (tab === "1M") setExtendDays(30);
                          else if (tab === "3M") setExtendDays(90);
                          else if (tab === "6M") setExtendDays(180);
                          else if (tab === "12M") setExtendDays(365);
                        }}
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
                  <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <label className="text-amber-900 font-extrabold text-xs flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Custom Duration & Custom Net Payable</span>
                      </label>
                      <span className="text-[10px] text-amber-800 font-bold">Admin Adjustable Amount</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-amber-900 block mb-1">Extension Days:</label>
                        <input
                          type="number"
                          value={extendDays}
                          onChange={(e) => setExtendDays(parseInt(e.target.value) || 30)}
                          className="w-full bg-white border border-amber-300 rounded-xl p-2 text-xs font-bold text-slate-800 font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-amber-900 block mb-1">Net Payable Amount (₹):</label>
                        <input
                          type="number"
                          value={planFee}
                          onChange={(e) => setPlanFee(parseFloat(e.target.value || 0))}
                          className="w-full bg-white border-2 border-emerald-500 rounded-xl p-2 text-xs font-black text-emerald-950 font-mono outline-none focus:border-emerald-700"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* DISCOUNT SECTION (Current Month Discount) */}
                {paymentType !== "COLLECT_DUES" && (
                  <div className="bg-cyan-50/70 p-4 rounded-2xl border border-cyan-200/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-800 font-extrabold text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                        <span>CURRENT MONTH DISCOUNT (₹)</span>
                      </label>
                      <span className="text-[10px] text-cyan-800 font-bold bg-cyan-100 px-2.5 py-0.5 rounded-full border border-cyan-200">
                        {durationTab === "CUSTOM" ? "✏️ Custom Mode (Net Payable Editable Above)" : "Immediate deduction (Won't go to dues)"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div>
                        <input
                          type="number"
                          min="0"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(e.target.value)}
                          placeholder="e.g. 100"
                          disabled={durationTab === "CUSTOM"}
                          className={`w-full bg-white border border-cyan-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold font-mono outline-none focus:border-cyan-600 ${
                            durationTab === "CUSTOM" ? "opacity-50 cursor-not-allowed bg-slate-100" : ""
                          }`}
                        />
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
                        <span>Net Payable:</span>
                        {durationTab === "CUSTOM" ? (
                          <div className="flex items-center gap-1">
                            <span className="text-emerald-700 font-black text-sm">₹</span>
                            <input
                              type="number"
                              value={planFee}
                              onChange={(e) => setPlanFee(parseFloat(e.target.value || 0))}
                              className="w-24 bg-emerald-50 border-2 border-emerald-400 rounded-lg px-2 py-1 text-emerald-800 font-black text-sm outline-none focus:border-emerald-600"
                            />
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-black text-sm">₹{effectivePayable}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* LOCKER FACILITY MANAGEMENT (ADD / REMOVE) */}
                <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-purple-600 shrink-0" />
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs block">Locker Facility Status</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {includeLocker
                            ? `Locker Active (${selectedMemberObj?.locker_no || "Assigned"})`
                            : "No Locker assigned for next period"}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setIncludeLocker(prev => !prev)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                        includeLocker
                          ? "bg-purple-600 text-white shadow-md hover:bg-purple-700"
                          : "bg-white border border-purple-300 text-purple-800 hover:bg-purple-50"
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {includeLocker
                          ? `Locker Active (Click to Remove -₹${lockerFee})`
                          : `+ Add Locker (+₹${lockerFee})`}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold pt-1 border-t border-purple-200/60">
                    <span className={includeLocker ? "text-purple-900 font-black" : "text-slate-500 font-bold"}>
                      {includeLocker ? "🔒 Locker Included for this Subscription" : "🔓 No Locker facility (Discontinued)"}
                    </span>
                    {selectedMemberObj?.has_locker !== includeLocker && (
                      <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black ${
                        includeLocker
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-amber-100 text-amber-900 border-amber-300"
                      }`}>
                        {includeLocker ? "+ Locker will be added on saving" : "❌ Locker will be removed on saving"}
                      </span>
                    )}
                  </div>

                  {includeLocker && (
                    <div className="flex items-center justify-between pt-1 border-t border-purple-200/60 animate-fadeIn">
                      <label className="text-[11px] font-bold text-purple-900">Locker Fee Amount (₹):</label>
                      <input
                        type="number"
                        value={lockerFee}
                        onChange={(e) => {
                          const newFee = parseFloat(e.target.value || 0);
                          const oldFee = parseFloat(lockerFee || 0);
                          const diff = newFee - oldFee;
                          setLockerFee(newFee);
                          setPlanFee(prev => Math.max(0, prev + diff));
                        }}
                        className="w-24 bg-white border border-purple-300 rounded-xl p-1.5 text-xs font-mono font-bold text-purple-900 outline-none focus:border-purple-600"
                      />
                    </div>
                  )}
                </div>
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
                    disabled={paymentType === "PAY_LATER" || isDuesBlocked}
                    className={`w-full border rounded-2xl p-3 outline-none font-extrabold font-mono text-sm ${
                      paymentType === "PAY_LATER" || isDuesBlocked
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

              {/* PROMISED PAYMENT DUE DATE (EDITABLE) */}
              {calculatedNewDues > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-300 p-4 rounded-2xl space-y-2 animate-fadeIn shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span>PROMISED PAYMENT DUE DATE (SET/EDIT)</span>
                    </label>
                    <span className="text-[9px] font-extrabold text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-md border border-amber-300">
                      Auto-Overdue if missed
                    </span>
                  </div>
                  <input
                    type="date"
                    value={promisedDueDate}
                    onChange={(e) => setPromisedDueDate(e.target.value)}
                    disabled={isDuesBlocked}
                    className="w-full bg-white border border-amber-300 rounded-xl p-3 text-xs font-black text-amber-950 font-mono outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200 shadow-inner"
                    required
                  />
                  <p className="text-[10px] text-amber-700 font-medium italic">
                    Staff can adjust this promised date for late entries or deferred payment extensions.
                  </p>
                </div>
              )}

              {/* PAYMENT MODE SELECTOR (Only if collecting money today) */}
              {parseFloat(amountPaidToday) > 0 && !isDuesBlocked && (
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
              {/* Date Paid is only shown when actual money is being collected (amount > 0) */}
              <div className={`grid grid-cols-1 gap-4 ${parseFloat(amountPaidToday) > 0 && !isDuesBlocked ? "sm:grid-cols-2" : ""}`}>
                {parseFloat(amountPaidToday) > 0 && !isDuesBlocked && (
                  <div>
                    <label className="text-slate-500 font-bold mb-1 block flex items-center justify-between">
                      <span>DATE PAID (COLLECTION DATE)</span>
                      <span className="text-[9px] font-medium text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">Receipt log only • Does not alter study period</span>
                    </label>
                    <input
                      type="date"
                      value={paidDate}
                      onChange={(e) => setPaidDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-bold"
                    />
                  </div>
                )}

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">NOTES / REMARKS</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isDuesBlocked}
                    placeholder="Optional transaction remarks..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              {isDuesBlocked ? (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType("COLLECT_DUES");
                    setAmountPaidToday(currDues);
                  }}
                  className="w-full py-4 rounded-2xl font-extrabold text-xs uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-white" />
                  <span>Click Here to Switch & Collect ₹{currDues} Pending Dues Now</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl font-extrabold text-xs uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>
                    {paymentType === "FULL" && "Record Full Payment & Activate Plan"}
                    {paymentType === "PARTIAL" && `Record Partial Payment (₹${amountPaidToday}) & Set ₹${calculatedNewDues} Dues`}
                    {paymentType === "PAY_LATER" && `Activate Plan with Pay Later (₹${calculatedNewDues} Overdue Dues)`}
                    {paymentType === "COLLECT_DUES" && `Collect ₹${amountPaidToday} Dues (${calculatedNewDues} Remaining)`}
                  </span>
                </button>
              )}
            </form>
          </div>
        </div>

        {/* BOTTOM FULL-WIDTH SECTION: PAYMENTS LEDGER HISTORY */}
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
                  <th className="p-3.5">STATUS</th>
                  <th className="p-3.5">MODE</th>
                  <th className="p-3.5">TRANSACTION DETAILS / NOTES</th>
                  <th className="p-3.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const rawPayments = ledgerFilter === "SELECTED" && selectedMemberId
                    ? payments.filter(p => p.member_id === selectedMemberId)
                    : payments;

                  const displayPayments = [...rawPayments].sort((a, b) => {
                    const timeA = a.paid_at ? new Date(a.paid_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
                    const timeB = b.paid_at ? new Date(b.paid_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
                    if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB) && timeA > 0 && timeB > 0) {
                      return timeB - timeA;
                    }
                    const numA = parseInt(String(a.invoice_id || '').replace(/\D/g, ''), 10) || 0;
                    const numB = parseInt(String(b.invoice_id || '').replace(/\D/g, ''), 10) || 0;
                    return numB - numA;
                  });

                  if (displayPayments.length === 0) {
                    return (
                      <tr><td colSpan="8" className="p-6 text-center text-slate-400 italic">No payments found in ledger for this filter.</td></tr>
                    );
                  }

                  return displayPayments.map((p) => {
                    const note = (p.notes || "").toLowerCase();
                    const amt = parseFloat(p.amount || 0);
                    let statusBadge = <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">FULL PAID</span>;

                    if (note.includes("partial") || note.includes("dues pending")) {
                      statusBadge = <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-300">PARTIAL</span>;
                    } else if (note.includes("pay later") || amt === 0) {
                      statusBadge = <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black border border-purple-300">PAY LATER</span>;
                    } else if (note.includes("recovery") || note.includes("collect dues")) {
                      statusBadge = <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-black border border-blue-300">DUES RECOVERY</span>;
                    }

                    return (
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
                        <td className="p-3.5">{statusBadge}</td>
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
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADVANCE RENEWAL CONFIRMATION MODAL FOR ACTIVE STUDENTS */}
        {activeConfirmModalOpen && pendingPaymentPayload && selectedMemberObj && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
            <div className="bg-white border border-amber-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-popIn">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Advance Renewal Confirmation</h3>
                  <p className="text-xs text-amber-700 font-bold">Student is currently ACTIVE</p>
                </div>
              </div>

              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 text-xs space-y-3">
                <p className="text-amber-950 font-medium leading-relaxed">
                  Student <strong className="text-slate-900 font-extrabold">{selectedMemberObj.full_name}</strong> is currently <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-extrabold border border-emerald-300">ACTIVE</span> until <strong className="font-mono text-cyan-800 font-black">{pendingPaymentPayload.currentExpiry}</strong>.
                </p>

                <div className="p-3.5 bg-white rounded-2xl border border-amber-200/90 space-y-2 font-mono text-[11px] shadow-2xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans font-bold">Current Expiration:</span>
                    <span className="font-black text-slate-800">{pendingPaymentPayload.currentExpiry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans font-bold">Upcoming Plan Extension:</span>
                    <span className="font-black text-amber-700">+{pendingPaymentPayload.extendDays} Days</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1.5">
                    <span className="text-slate-500 font-sans font-bold">New Expiration Date:</span>
                    <span className="font-black text-emerald-700">{pendingPaymentPayload.finalExpiryDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans font-bold">Amount to Collect Today:</span>
                    <span className="font-black text-emerald-600">₹{pendingPaymentPayload.parsedPaidToday}</span>
                  </div>
                </div>

                <div className="text-slate-900 font-bold text-xs bg-amber-100/90 p-3.5 rounded-2xl border border-amber-300 space-y-1">
                  <p className="flex items-center gap-1.5 font-extrabold text-amber-950">
                    <HelpCircle className="w-4 h-4 text-amber-700" />
                    <span>Advance Payment Confirmation Check:</span>
                  </p>
                  <p className="text-slate-800 font-medium">
                    Advance me upcoming <strong>{pendingPaymentPayload.extendDays} days</strong> (after expiration date <strong>{pendingPaymentPayload.currentExpiry}</strong>) of the particular student ke liye payment record add kar rahe ho?
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveConfirmModalOpen(false);
                    setPendingPaymentPayload(null);
                  }}
                  className="w-full py-3.5 rounded-2xl border border-slate-200 font-extrabold text-xs text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel (Do Not Add)
                </button>
                <button
                  type="button"
                  onClick={() => executePaymentRecord(pendingPaymentPayload)}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Yes, Add Payment</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS RECEIPT MODAL */}
        {successPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-popIn">
              <div className="text-center space-y-2">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${successPayment?.amount === 0 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {successPayment?.amount === 0 ? "Subscription Activated!" : "Payment Verified & Saved!"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Invoice ID: <strong className="font-mono text-cyan-600">{successPayment.invoice_id}</strong></p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 font-bold">
                  <span>Student Name:</span>
                  <span className="text-slate-900">{successPayment.member_name}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-bold">
                  <span>{successPayment?.amount === 0 ? "Dues Pending:" : "Amount Paid Today:"}</span>
                  <span className={`font-mono text-sm font-black ${successPayment?.amount === 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {successPayment?.amount === 0 ? `₹${selectedMemberObj?.outstanding_dues || "—"}` : `₹${successPayment.amount}`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 font-bold">
                  <span>Payment Scheme:</span>
                  <span className="text-cyan-700">{paymentType}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSuccessPayment(null)}
                  className="p-3 rounded-2xl border border-slate-200 font-extrabold text-xs text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <a
                  href={`/invoice?id=${successPayment.invoice_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/25"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const studentObj = members.find(m => m.id === successPayment.member_id);
                    const invUrl = typeof window !== 'undefined' ? `${window.location.origin}/invoice?id=${successPayment.invoice_id}` : `http://localhost:3000/invoice?id=${successPayment.invoice_id}`;
                    const msg = formatWhatsAppMessage("receipt", {
                      student_name: successPayment.member_name || "Student",
                      amount: successPayment.amount,
                      payment_mode: successPayment.payment_mode,
                      invoice_id: successPayment.invoice_id,
                      invoice_url: invUrl
                    });
                    openWhatsAppDirectMessage(studentObj?.mobile, msg);
                  }}
                  className="p-3 rounded-2xl bg-[#25D366] hover:bg-[#1db954] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT STUDENT MODAL */}
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
                    onChange={(e) => {
                      const newShift = e.target.value;
                      const oldBasePrice = editFormData.shift === "Full Day" ? 1100 : (editFormData.shift === "Morning" || editFormData.shift === "Evening" ? 600 : editFormData.plan_amount);
                      const newBasePrice = newShift === "Full Day" ? 1100 : (newShift === "Morning" || newShift === "Evening" ? 600 : editFormData.plan_amount);
                      const diff = newBasePrice - oldBasePrice;
                      const currentDues = parseFloat(editFormData.outstanding_dues || 0);
                      const newDues = Math.max(0, currentDues + diff);
                      setEditFormData({ ...editFormData, shift: newShift, plan_amount: newBasePrice, outstanding_dues: newDues });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-bold"
                  >
                    <option value="Full Day">Full Day Access (06:00 AM - 10:00 PM)</option>
                    <option value="Morning">Morning Shift (06:00 AM - 02:00 PM)</option>
                    <option value="Evening">Evening Shift (02:00 PM - 10:00 PM)</option>
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
                  <label className="text-indigo-800 font-extrabold mb-1 block">Subscription Start Date</label>
                  <input
                    type="date"
                    value={editFormData.sub_start_date || ""}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const newSubEnd = newStart ? addOneMonth(newStart) : editFormData.subscription_end_date;
                      setEditFormData({ ...editFormData, sub_start_date: newStart, subscription_end_date: newSubEnd });
                    }}
                    className="w-full bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3 text-indigo-950 font-mono font-bold outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Subscription Expiry Date</label>
                  <input
                    type="date"
                    value={editFormData.subscription_end_date}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      setEditFormData({
                        ...editFormData,
                        subscription_end_date: newEnd,
                        sub_start_date: newEnd ? subtractOneMonth(newEnd) : editFormData.sub_start_date
                      });
                    }}
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

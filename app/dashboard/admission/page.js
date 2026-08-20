"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  UserPlus,
  User,
  Phone,
  Calendar,
  Grid,
  CreditCard,
  CheckCircle2,
  Send,
  Printer,
  Sparkles,
  AlertCircle,
  Lock,
  X,
  UserCheck,
  Tag,
  Zap,
  Check,
  Edit3,
  Clock,
  Layers
} from "lucide-react";
import {
  fetchMembers,
  createMember,
  updateMember,
  recordPayment,
  readmitMember,
  getNextPermanentId,
  formatDate,
  addOneMonth,
  logActivity
} from "@/lib/adminService";
import { formatWhatsAppMessage, openWhatsAppDirectMessage } from "@/lib/whatsappTemplates";

export default function NewAdmissionPage() {
  const router = useRouter();
  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState("2026-07");
  const [allMembers, setAllMembers] = useState([]);
  const [existingMembers, setExistingMembers] = useState([]);
  const [submittedMember, setSubmittedMember] = useState(null);

  // Admission Mode Switcher: "STANDARD" | "EXPRESS"
  const [admissionMode, setAdmissionMode] = useState("STANDARD");
  const [expressSuccessMsg, setExpressSuccessMsg] = useState("");
  const [expressModalToast, setExpressModalToast] = useState(null);

  // Quick Student Search / Re-admission Lookup State
  const [lookupQuery, setLookupQuery] = useState("");
  const [foundPastStudent, setFoundPastStudent] = useState(null);
  const [isReadmissionMode, setIsReadmissionMode] = useState(false);
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [lockerAddonFee, setLockerAddonFee] = useState(200);

  // Form State for Standard Single Admission
  const [formData, setFormData] = useState({
    permanent_id: "MSL0001",
    full_name: "",
    father_name: "",
    mobile: "",
    dob: "",
    gender: "Male",
    address: "",
    aadhar_no: "",
    targeting_exam: "UPSC CSE",
    shift: "Full Day",
    has_locker: false,
    locker_fee: 0,
    joining_date: formatDate(new Date()),
    duration_days: 30,
    plan_amount: 1100,
    discount_amount: 0,
    payment_status: "PAY_LATER",
    deposit_amount: 0,
    payment_mode: "UPI",
    due_date: "",
    existing_id: null
  });

  // Form State for Express Batch Entry
  const [expressForm, setExpressForm] = useState({
    status: "ACTIVE", // ACTIVE or LEFT
    full_name: "",
    mobile: "",
    father_name: "",
    aadhar_no: "",
    payment_mode: "Cash",
    
    // June 2026
    paid_june: true,
    june_shift: "Full Day",
    june_locker: false,
    june_discount: 0,
    june_date: "2026-06-01",

    // July 2026
    paid_july: true,
    july_shift: "Full Day",
    july_locker: false,
    july_discount: 0,
    july_date: "2026-07-01",

    // August 2026
    paid_august: true,
    august_shift: "Full Day",
    august_locker: false,
    august_discount: 0,
    august_date: "2026-08-01",

    left_reason: "Completed 1 month & exited"
  });

  useEffect(() => {
    async function load() {
      const all = await fetchMembers("ALL");
      setAllMembers(all);
      const branchMembers = all.filter(m => m.branch === activeBranch || !m.branch);
      setExistingMembers(branchMembers);

      if (!isReadmissionMode) {
        const nextId = getNextPermanentId(all);
        setFormData(prev => ({ ...prev, permanent_id: nextId }));
      }
    }
    load();
  }, [activeBranch]);

  const handleExpressSubmit = async (e) => {
    e.preventDefault();
    if (!expressForm.full_name || !expressForm.mobile) {
      alert("Please enter Student Full Name and Mobile Phone Number.");
      return;
    }

    const freshAllMembers = await fetchMembers("ALL");
    setAllMembers(freshAllMembers);
    const branchMembers = freshAllMembers.filter(m => m.branch === activeBranch || !m.branch);
    setExistingMembers(branchMembers);

    const currentNextId = getNextPermanentId(freshAllMembers);
    const isStudentActive = expressForm.status === "ACTIVE";

    const juneBase = (expressForm.june_shift === "Morning" || expressForm.june_shift === "Evening") ? 600 : 1100;
    const juneLockerFee = expressForm.june_locker ? 50 : 0;
    const juneDisc = parseFloat(expressForm.june_discount) || 0;
    const juneNet = Math.max(0, juneBase + juneLockerFee - juneDisc);

    const julyBase = (expressForm.july_shift === "Morning" || expressForm.july_shift === "Evening") ? 600 : 1100;
    const julyLockerFee = expressForm.july_locker ? 50 : 0;
    const julyDisc = parseFloat(expressForm.july_discount) || 0;
    const julyNet = Math.max(0, julyBase + julyLockerFee - julyDisc);

    const augustBase = (expressForm.august_shift === "Morning" || expressForm.august_shift === "Evening") ? 600 : 1100;
    const augustLockerFee = expressForm.august_locker ? 50 : 0;
    const augustDisc = parseFloat(expressForm.august_discount) || 0;
    const augustNet = Math.max(0, augustBase + augustLockerFee - augustDisc);

    let activeShift = expressForm.june_shift || "Full Day";
    let activePlanAmt = juneBase + juneLockerFee;
    let activeHasLocker = !!expressForm.june_locker;

    if (expressForm.paid_july) {
      activeShift = expressForm.july_shift || activeShift;
      activePlanAmt = julyBase + julyLockerFee;
      activeHasLocker = !!expressForm.july_locker;
    }
    if (expressForm.paid_august && isStudentActive) {
      activeShift = expressForm.august_shift || activeShift;
      activePlanAmt = augustBase + augustLockerFee;
      activeHasLocker = !!expressForm.august_locker;
    }

    let latestPaymentDate = expressForm.june_date || "2026-06-01";
    if (expressForm.paid_july && expressForm.july_date) {
      latestPaymentDate = expressForm.july_date;
    }
    if (expressForm.paid_august && isStudentActive && expressForm.august_date) {
      latestPaymentDate = expressForm.august_date;
    }
    const computedExpressSubEndDate = addOneMonth(latestPaymentDate);

    // 1. Create Student Member Profile
    const memberPayload = {
      permanent_id: currentNextId,
      full_name: expressForm.full_name,
      father_name: expressForm.father_name || "",
      mobile: expressForm.mobile,
      aadhar_no: expressForm.aadhar_no || "",
      gender: "Male",
      targeting_exam: "General",
      shift: activeShift,
      seat_no: null,
      has_locker: activeHasLocker,
      locker_no: activeHasLocker ? "L-Express" : null,
      plan_amount: activePlanAmt,
      outstanding_dues: 0,
      is_active: isStudentActive,
      status: expressForm.status,
      joining_date: expressForm.june_date || "2026-06-01",
      subscription_end_date: isStudentActive ? computedExpressSubEndDate : (expressForm.july_date ? addOneMonth(expressForm.july_date) : (expressForm.june_date ? addOneMonth(expressForm.june_date) : "2026-07-01")),
      left_at: isStudentActive ? null : (expressForm.july_date ? `${expressForm.july_date}T12:00:00.000Z` : new Date().toISOString()),
      left_reason: isStudentActive ? null : expressForm.left_reason,
      branch: activeBranch
    };

    const newMem = await createMember(memberPayload, "Admin (Express Batch)");

    // 2. Create Specific Monthly Payment Receipts with exact payment dates, shifts & discounts
    if (newMem && newMem.id) {
      // June Payment Receipt
      if (expressForm.paid_june) {
        await recordPayment({
          member_id: newMem.id,
          member_name: newMem.full_name,
          amount: juneNet,
          branch: activeBranch,
          payment_mode: expressForm.payment_mode,
          notes: `Express June Fee (${expressForm.june_shift})` + (expressForm.june_discount > 0 ? ` [Disc: ₹${expressForm.june_discount}]` : ''),
          paid_at: expressForm.june_date || "2026-06-01",
          end_date: computedExpressSubEndDate,
          actor: "Admin"
        });
      }

      // July Payment Receipt
      if (expressForm.paid_july) {
        await recordPayment({
          member_id: newMem.id,
          member_name: newMem.full_name,
          amount: julyNet,
          branch: activeBranch,
          payment_mode: expressForm.payment_mode,
          notes: `Express July Fee (${expressForm.july_shift})` + (expressForm.july_discount > 0 ? ` [Disc: ₹${expressForm.july_discount}]` : ''),
          paid_at: expressForm.july_date || "2026-07-01",
          end_date: computedExpressSubEndDate,
          actor: "Admin"
        });
      }

      // August Payment Receipt
      if (expressForm.paid_august && isStudentActive) {
        await recordPayment({
          member_id: newMem.id,
          member_name: newMem.full_name,
          amount: augustNet,
          branch: activeBranch,
          payment_mode: expressForm.payment_mode,
          notes: `Express August Fee (${expressForm.august_shift})` + (expressForm.august_discount > 0 ? ` [Disc: ₹${expressForm.august_discount}]` : ''),
          paid_at: expressForm.august_date || "2026-08-01",
          end_date: computedExpressSubEndDate,
          actor: "Admin"
        });
      }

      await logActivity({
        branch: activeBranch,
        action_type: "EXPRESS_ADMISSION",
        entity_type: "member",
        entity_id: newMem.id,
        details: `Express Batch Admission registered: ${newMem.permanent_id || currentNextId} - ${expressForm.full_name} (${expressForm.status})`,
        performed_by: "Admin"
      });
    }

    // 3. Refresh List & Prepare Next MSL ID
    const updatedAllMembers = await fetchMembers("ALL");
    setAllMembers(updatedAllMembers);
    const updatedBranchMembers = updatedAllMembers.filter(m => m.branch === activeBranch || !m.branch);
    setExistingMembers(updatedBranchMembers);
    const nextSeqId = getNextPermanentId(updatedAllMembers);

    setExpressSuccessMsg(`✅ ${newMem?.permanent_id || currentNextId} - ${expressForm.full_name} saved successfully to Supabase! Loaded next ID: ${nextSeqId}`);
    
    // Show 2-second centered popup in the middle of the screen!
    setExpressModalToast({
      id: newMem?.permanent_id || currentNextId,
      name: expressForm.full_name,
      status: expressForm.status
    });

    setTimeout(() => {
      setExpressModalToast(null);
    }, 2000);

    // Reset inputs for instant next entry
    setExpressForm(prev => ({
      ...prev,
      full_name: "",
      mobile: "",
      father_name: "",
      aadhar_no: "",
      seat_no: "",
      locker_no: ""
    }));

    setTimeout(() => setExpressSuccessMsg(""), 6000);
  };

  // Auto-fill from Enquiry URL query params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const nameParam = params.get("name") || params.get("fullName");
      const phoneParam = params.get("phone") || params.get("mobile");
      const shiftParam = params.get("shift") || params.get("interest");

      if (nameParam || phoneParam) {
        setFormData(prev => ({
          ...prev,
          full_name: nameParam || prev.full_name,
          mobile: phoneParam || prev.mobile,
          shift: shiftParam || prev.shift,
          joining_date: formatDate(new Date()),
          due_date: ""
        }));
      }
    }
  }, []);

  // Handle Quick Student Search Lookup by Mobile or MSLxxxx ID
  const handleLookupSearch = (queryStr) => {
    setLookupQuery(queryStr);
    if (!queryStr || queryStr.trim().length < 3) {
      setFoundPastStudent(null);
      return;
    }
    const clean = queryStr.trim().toLowerCase();
    const match = existingMembers.find(m => {
      const mob = m.mobile ? String(m.mobile).trim().toLowerCase() : '';
      const permId = m.permanent_id ? String(m.permanent_id).trim().toLowerCase() : '';
      return mob.includes(clean) || permId.includes(clean);
    });
    setFoundPastStudent(match || null);
  };

  // Auto-fill form from existing student profile
  const handleApplyExistingStudent = (student) => {
    if (!student) return;
    setIsReadmissionMode(true);
    setFormData(prev => ({
      ...prev,
      existing_id: student.id,
      permanent_id: student.permanent_id || prev.permanent_id,
      full_name: student.full_name || "",
      father_name: student.father_name || "",
      mobile: student.mobile || "",
      dob: student.dob || "",
      gender: student.gender || "Male",
      address: student.address || "",
      aadhar_no: student.aadhar_no || "",
      targeting_exam: student.targeting_exam || "UPSC CSE",
      shift: student.shift || "Full Day",
      has_locker: student.has_locker || false
    }));
  };

  const handleResetForm = () => {
    setIsReadmissionMode(false);
    setFoundPastStudent(null);
    setLookupQuery("");
    const nextId = getNextPermanentId(allMembers);
    setFormData({
      permanent_id: nextId,
      full_name: "",
      father_name: "",
      mobile: "",
      dob: "",
      gender: "Male",
      address: "",
      aadhar_no: "",
      targeting_exam: "UPSC CSE",
      shift: "Full Day",
      has_locker: false,
      joining_date: formatDate(new Date()),
      duration_days: 30,
      plan_amount: 1100,
      discount_amount: 0,
      payment_status: "PAY_LATER",
      deposit_amount: 0,
      payment_mode: "UPI",
      due_date: "",
      existing_id: null
    });
  };

  // Update plan amount when shift changes
  const handleShiftChange = (shiftVal) => {
    let basePrice = 1100;
    if (shiftVal === "Morning" || shiftVal === "Evening" || shiftVal === "Afternoon" || shiftVal === "Night") {
      basePrice = 600;
    }
    setFormData(prev => {
      const lockerAdd = prev.has_locker ? (parseFloat(prev.locker_fee) || 50) : 0;
      return {
        ...prev,
        shift: shiftVal,
        plan_amount: basePrice + lockerAdd
      };
    });
  };

  // Prevent premature form submit on Enter key press & move focus to next input field
  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter' && e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) {
      if (e.target.type === 'submit' || e.target.type === 'button') return;
      e.preventDefault();
      const form = e.target.form;
      if (form) {
        const formElements = Array.from(form.elements).filter(
          el => !el.disabled && el.type !== 'hidden' && el.type !== 'submit' && el.type !== 'button' && (el.tagName === 'INPUT' || el.tagName === 'SELECT')
        );
        const index = formElements.indexOf(e.target);
        if (index > -1 && index + 1 < formElements.length) {
          const nextElement = formElements[index + 1];
          if (nextElement && typeof nextElement.focus === 'function') {
            nextElement.focus();
          }
        }
      }
    }
  };

  // Expiry date calculation
  const calculatedEndDate = () => {
    const start = new Date(formData.joining_date || new Date());
    start.setDate(start.getDate() + parseInt(formData.duration_days || 30));
    return formatDate(start);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const finalAmount = Math.max(0, formData.plan_amount || (formData.shift === 'Full Day' ? 1100 : 600));
      const freshAll = await fetchMembers("ALL");
      setAllMembers(freshAll);
      const freshBranch = freshAll.filter(m => m.branch === activeBranch || !m.branch);
      setExistingMembers(freshBranch);
      const liveNextId = isReadmissionMode ? formData.permanent_id : getNextPermanentId(freshAll);

      let newMem = null;

      if (isReadmissionMode && formData.existing_id) {
        newMem = await readmitMember(formData.existing_id, {
          shift: formData.shift,
          seat_no: null,
          plan_amount: finalAmount,
          paid_amount: 0,
          payment_mode: 'Cash'
        });
        // Also update personal details if edited
        await updateMember(formData.existing_id, {
          full_name: formData.full_name,
          father_name: formData.father_name,
          mobile: formData.mobile,
          dob: formData.dob || null,
          gender: formData.gender,
          address: formData.address,
          aadhar_no: formData.aadhar_no,
          targeting_exam: formData.targeting_exam,
          has_locker: formData.has_locker,
          outstanding_dues: finalAmount,
          payment_status: 'PAY_LATER',
          due_date: formData.due_date
        });
      } else {
        const memberPayload = {
          permanent_id: liveNextId,
          full_name: formData.full_name,
          father_name: formData.father_name,
          mobile: formData.mobile,
          dob: formData.dob || null,
          gender: formData.gender,
          address: formData.address,
          aadhar_no: formData.aadhar_no,
          targeting_exam: formData.targeting_exam,
          branch: activeBranch,
          shift: formData.shift,
          seat_no: null,
          has_locker: formData.has_locker,
          locker_no: null,
          joining_date: formData.joining_date,
          subscription_end_date: calculatedEndDate(),
          plan_amount: finalAmount,
          outstanding_dues: finalAmount,
          payment_status: 'PAY_LATER',
          due_date: formData.due_date,
          left_with_dues: false,
          loss_amount: 0
        };

        newMem = await createMember(memberPayload);

        await logActivity({
          branch: activeBranch,
          action_type: 'student_admission',
          entity_type: 'member',
          entity_id: newMem?.id || formData.permanent_id,
          details: `Admitted new student ${formData.full_name} (${newMem?.permanent_id || formData.permanent_id}) - Shift: ${formData.shift}, Plan Dues: ₹${finalAmount}`,
          after_state: newMem
        });
      }

      // Direct redirect to Student Directory with student control modal opened!
      const targetId = newMem?.id || formData.permanent_id;
      if (targetId) {
        router.push(`/dashboard/members?memberId=${targetId}`);
      } else {
        setSubmittedMember(newMem || formData);
      }
    } catch (err) {
      console.error("Admission submission error:", err);
      setSubmittedMember(formData);
    }
  };

  return (
    <DashboardLayout activeBranch={activeBranch} setActiveBranch={setActiveBranch} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}>
      <div className="max-w-4xl mx-auto space-y-8 animate-[fadeIn_0.3s_ease-out]">
        {/* Admission Mode Tabs */}
        <div className="flex bg-slate-200/80 p-1.5 rounded-2xl gap-2 text-xs font-black shadow-inner">
          <button
            type="button"
            onClick={() => setAdmissionMode("STANDARD")}
            className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              admissionMode === "STANDARD"
                ? "bg-white text-slate-900 shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserPlus className="w-4 h-4 text-cyan-600" />
            <span>1. Standard Individual Admission</span>
          </button>
          <button
            type="button"
            onClick={() => setAdmissionMode("EXPRESS")}
            className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              admissionMode === "EXPRESS"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            <span>2. ⚡ Express Batch Entry (MSL0001 - MSL0155)</span>
          </button>
        </div>

        {expressSuccessMsg && (
          <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 text-xs font-black text-emerald-950 flex items-center gap-2 shadow-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{expressSuccessMsg}</span>
          </div>
        )}

        {/* Express Batch Centered Save Popup (Auto-disappears in 2 sec) */}
        {expressModalToast && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 max-w-sm w-full mx-4 shadow-2xl text-center space-y-4 animate-popIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <span className="px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono text-xs font-black border border-emerald-200">
                  {expressModalToast.id}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2">
                  {expressModalToast.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Saved Successfully to Supabase Database!
                </p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">
                Status: <span className={expressModalToast.status === "ACTIVE" ? "text-emerald-600 font-extrabold" : "text-rose-600 font-extrabold"}>{expressModalToast.status === "ACTIVE" ? "✅ Active Student" : "🚫 Left Student"}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono italic">Closing in 2 seconds...</p>
            </div>
          </div>
        )}

        {!submittedMember ? (
          <div className="space-y-6">
            {admissionMode === "EXPRESS" ? (
              <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span>Express High-Speed Batch Admission</span>
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">Fast entry for 155 past & active students with exact monthly payment dates</p>
                  </div>
                  <span className="px-4 py-2 rounded-2xl bg-amber-500 text-slate-950 font-mono text-sm font-black shadow-sm">
                    {getNextPermanentId(allMembers.length > 0 ? allMembers : existingMembers)}
                  </span>
                </div>

                <form onSubmit={handleExpressSubmit} onKeyDown={handleFormKeyDown} className="space-y-6">
                  {/* Student Active / Left Status Selector */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800">STUDENT CURRENT STATUS:</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setExpressForm({ ...expressForm, status: "ACTIVE" })}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          expressForm.status === "ACTIVE"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-white text-slate-600 border border-slate-200"
                        }`}
                      >
                        ✅ STILL ACTIVE (Studying Now)
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpressForm({ ...expressForm, status: "LEFT" })}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          expressForm.status === "LEFT"
                            ? "bg-rose-600 text-white shadow-sm"
                            : "bg-white text-slate-600 border border-slate-200"
                        }`}
                      >
                        🚫 LEFT ARCHIVE (Studied 1-2 Months & Exited)
                      </button>
                    </div>
                  </div>

                  {/* Student Basic Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="text-slate-700 font-bold mb-1 block">Full Name <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={expressForm.full_name}
                        onChange={(e) => setExpressForm({ ...expressForm, full_name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold outline-none focus:border-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 font-bold mb-1 block">Mobile Number <span className="text-rose-500">*</span></label>
                      <input
                        type="tel"
                        required
                        value={expressForm.mobile}
                        onChange={(e) => setExpressForm({ ...expressForm, mobile: e.target.value })}
                        placeholder="e.g. 9876543210"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold outline-none focus:border-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 font-bold mb-1 block">Father&apos;s Name</label>
                      <input
                        type="text"
                        value={expressForm.father_name}
                        onChange={(e) => setExpressForm({ ...expressForm, father_name: e.target.value })}
                        placeholder="e.g. Suresh Sharma"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium outline-none focus:border-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 font-bold mb-1 block">Aadhar Card Number</label>
                      <input
                        type="text"
                        value={expressForm.aadhar_no}
                        onChange={(e) => setExpressForm({ ...expressForm, aadhar_no: e.target.value })}
                        placeholder="1234-5678-9012"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-medium outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  {/* Monthly Payments Grid with Exact Payment Dates, Per-Month Shift & Discount */}
                  <div className="bg-cyan-50/70 p-4 rounded-2xl border border-cyan-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-cyan-950 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-cyan-600" />
                        <span>Monthly Shift Allotment, Discount & Payment Collections</span>
                      </h4>
                      <div className="flex items-center gap-3 text-xs font-bold">
                        <span>Payment Mode:</span>
                        <select
                          value={expressForm.payment_mode}
                          onChange={(e) => setExpressForm({ ...expressForm, payment_mode: e.target.value })}
                          className="bg-white border border-cyan-300 rounded-lg px-2 py-1 text-slate-900 font-bold outline-none"
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI / GPay</option>
                          <option value="Online">Online Bank Transfer</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* June 2026 */}
                      {(() => {
                        const juneBase = (expressForm.june_shift === "Morning" || expressForm.june_shift === "Evening") ? 600 : 1100;
                        const juneLockerFee = expressForm.june_locker ? 50 : 0;
                        const juneDisc = isNaN(parseFloat(expressForm.june_discount)) ? 0 : parseFloat(expressForm.june_discount);
                        const juneNet = Math.max(0, juneBase + juneLockerFee - juneDisc);
                        return (
                          <div className={`p-3.5 rounded-2xl border space-y-2.5 transition-all ${expressForm.paid_june ? 'bg-white border-cyan-400 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                            <label className="flex items-center justify-between font-black text-slate-900 cursor-pointer border-b border-slate-100 pb-2">
                              <span className="text-xs">June 2026 (<span className="text-cyan-700 font-mono">₹{juneNet}</span>)</span>
                              <input
                                type="checkbox"
                                checked={expressForm.paid_june}
                                onChange={(e) => setExpressForm(prev => ({ ...prev, paid_june: e.target.checked }))}
                                className="w-4 h-4 accent-cyan-600 cursor-pointer"
                              />
                            </label>
                            {expressForm.paid_june && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1">
                                    <label className="text-[10px] font-extrabold text-slate-500 block mb-0.5">Shift Allotted:</label>
                                    <select
                                      value={expressForm.june_shift}
                                      onChange={(e) => setExpressForm(prev => ({ ...prev, june_shift: e.target.value }))}
                                      className="w-full bg-slate-50 border border-cyan-200 rounded-lg p-1.5 pr-1 text-[11px] font-bold text-slate-900 outline-none"
                                    >
                                      <option value="Full Day">Full Day (₹1100)</option>
                                      <option value="Morning">Morning (₹600)</option>
                                      <option value="Evening">Evening (₹600)</option>
                                    </select>
                                  </div>
                                  <div className="pt-3">
                                    <label className={`flex items-center gap-1 cursor-pointer px-2 py-1.5 rounded-lg border text-[10px] font-extrabold transition-all ${expressForm.june_locker ? 'bg-purple-100 border-purple-300 text-purple-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                      <input
                                        type="checkbox"
                                        checked={expressForm.june_locker}
                                        onChange={(e) => setExpressForm(prev => ({ ...prev, june_locker: e.target.checked }))}
                                        className="w-3 h-3 accent-purple-600 cursor-pointer"
                                      />
                                      <span>Locker (+₹50)</span>
                                    </label>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-extrabold text-slate-500 block mb-0.5">Discount (₹):</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={expressForm.june_discount}
                                      onChange={(e) => setExpressForm(prev => ({ ...prev, june_discount: e.target.value }))}
                                      className="w-full bg-slate-50 border border-cyan-200 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-900 outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-extrabold text-slate-500 block mb-0.5">Payment Date:</label>
                                    <input
                                      type="date"
                                      value={expressForm.june_date}
                                      onChange={(e) => setExpressForm(prev => ({ ...prev, june_date: e.target.value }))}
                                      className="w-full bg-slate-50 border border-cyan-200 rounded-lg p-1.5 text-[11px] font-mono font-bold text-slate-900 outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* July 2026 */}
                      {(() => {
                        const julyBase = (expressForm.july_shift === "Morning" || expressForm.july_shift === "Evening") ? 600 : 1100;
                        const julyLockerFee = expressForm.july_locker ? 50 : 0;
                        const julyDisc = isNaN(parseFloat(expressForm.july_discount)) ? 0 : parseFloat(expressForm.july_discount);
                        const julyNet = Math.max(0, julyBase + julyLockerFee - julyDisc);
                        return (
                          <div className={`p-3.5 rounded-2xl border space-y-2.5 transition-all ${expressForm.paid_july ? 'bg-white border-cyan-400 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                            <label className="flex items-center justify-between font-black text-slate-900 cursor-pointer border-b border-slate-100 pb-2">
                              <span className="text-xs">July 2026 (<span className="text-cyan-700 font-mono">₹{julyNet}</span>)</span>
                              <input
                                type="checkbox"
                                checked={expressForm.paid_july}
                                onChange={(e) => setExpressForm(prev => ({ ...prev, paid_july: e.target.checked }))}
                                className="w-4 h-4 accent-cyan-600 cursor-pointer"
                              />
                            </label>
                            {expressForm.paid_july && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1">
                                    <label className="text-[10px] font-extrabold text-slate-500 block mb-0.5">Shift Allotted:</label>
                                    <select
                                      value={expressForm.july_shift}
                                      onChange={(e) => setExpressForm(prev => ({ ...prev, july_shift: e.target.value }))}
                                      className="w-full bg-slate-50 border border-cyan-200 rounded-lg p-1.5 pr-1 text-[11px] font-bold text-slate-900 outline-none"
                                    >
                                      <option value="Full Day">Full Day (₹1100)</option>
                                      <option value="Morning">Morning (₹600)</option>
                                      <option value="Evening">Evening (₹600)</option>
                                    </select>
                                  </div>
                                  <div className="pt-3">
                                    <label className={`flex items-center gap-1 cursor-pointer px-2 py-1.5 rounded-lg border text-[10px] font-extrabold transition-all ${expressForm.july_locker ? 'bg-purple-100 border-purple-300 text-purple-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                      <input
                                        type="checkbox"
                                        checked={expressForm.july_locker}
                                        onChange={(e) => setExpressForm(prev => ({ ...prev, july_locker: e.target.checked }))}
                                        className="w-3 h-3 accent-purple-600 cursor-pointer"
                                      />
                                      <span>Locker (+₹50)</span>
                                    </label>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-extrabold text-slate-500 block mb-0.5">Discount (₹):</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={expressForm.july_discount}
                                      onChange={(e) => setExpressForm(prev => ({ ...prev, july_discount: e.target.value }))}
                                      className="w-full bg-slate-50 border border-cyan-200 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-900 outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-extrabold text-slate-500 block mb-0.5">Payment Date:</label>
                                    <input
                                      type="date"
                                      value={expressForm.july_date}
                                      onChange={(e) => setExpressForm(prev => ({ ...prev, july_date: e.target.value }))}
                                      className="w-full bg-slate-50 border border-cyan-200 rounded-lg p-1.5 text-[11px] font-mono font-bold text-slate-900 outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* August 2026 */}
                      {(() => {
                        const augustBase = (expressForm.august_shift === "Morning" || expressForm.august_shift === "Evening") ? 600 : 1100;
                        const augustLockerFee = expressForm.august_locker ? 50 : 0;
                        const augustDisc = isNaN(parseFloat(expressForm.august_discount)) ? 0 : parseFloat(expressForm.august_discount);
                        const augustNet = Math.max(0, augustBase + augustLockerFee - augustDisc);
                        return (
                          <div className={`p-3.5 rounded-2xl border space-y-2.5 transition-all ${expressForm.paid_august && expressForm.status === "ACTIVE" ? 'bg-white border-cyan-400 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                            <label className="flex items-center justify-between font-black text-slate-900 cursor-pointer border-b border-slate-100 pb-2">
                              <span className="text-xs">August 2026 (<span className="text-cyan-700 font-mono">₹{augustNet}</span>)</span>
                              <input
                                type="checkbox"
                                disabled={expressForm.status === "LEFT"}
                                checked={expressForm.paid_august && expressForm.status === "ACTIVE"}
                                onChange={(e) => setExpressForm(prev => ({ ...prev, paid_august: e.target.checked }))}
                                className="w-4 h-4 accent-cyan-600 cursor-pointer"
                              />
                            </label>
                            {expressForm.paid_august && expressForm.status === "ACTIVE" && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1">
                                    <label className="text-[10px] font-extrabold text-slate-500 block mb-0.5">Shift Allotted:</label>
                                    <select
                                      value={expressForm.august_shift}
                                      onChange={(e) => setExpressForm(prev => ({ ...prev, august_shift: e.target.value }))}
                                      className="w-full bg-slate-50 border border-cyan-200 rounded-lg p-1.5 pr-1 text-[11px] font-bold text-slate-900 outline-none"
                                    >
                                      <option value="Full Day">Full Day (₹1100)</option>
                                      <option value="Morning">Morning (₹600)</option>
                                      <option value="Evening">Evening (₹600)</option>
                                    </select>
                                  </div>
                                  <div className="pt-3">
                                    <label className={`flex items-center gap-1 cursor-pointer px-2 py-1.5 rounded-lg border text-[10px] font-extrabold transition-all ${expressForm.august_locker ? 'bg-purple-100 border-purple-300 text-purple-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                      <input
                                        type="checkbox"
                                        checked={expressForm.august_locker}
                                        onChange={(e) => setExpressForm(prev => ({ ...prev, august_locker: e.target.checked }))}
                                        className="w-3 h-3 accent-purple-600 cursor-pointer"
                                      />
                                      <span>Locker (+₹50)</span>
                                    </label>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-extrabold text-slate-500 block mb-0.5">Discount (₹):</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={expressForm.august_discount}
                                      onChange={(e) => setExpressForm(prev => ({ ...prev, august_discount: e.target.value }))}
                                      className="w-full bg-slate-50 border border-cyan-200 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-900 outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-extrabold text-slate-500 block mb-0.5">Payment Date:</label>
                                    <input
                                      type="date"
                                      value={expressForm.august_date}
                                      onChange={(e) => setExpressForm(prev => ({ ...prev, august_date: e.target.value }))}
                                      className="w-full bg-slate-50 border border-cyan-200 rounded-lg p-1.5 text-[11px] font-mono font-bold text-slate-900 outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Left Student Minimal Exit Info */}
                  {expressForm.status === "LEFT" && (
                    <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 space-y-3 animate-fadeIn text-xs">
                      <h4 className="font-extrabold text-rose-900 flex items-center gap-1.5">
                        <X className="w-4 h-4 text-rose-600" />
                        <span>Left Student Exit Details</span>
                      </h4>
                      <div>
                        <label className="text-rose-900 font-bold block mb-1">Reason for Leaving:</label>
                        <input
                          type="text"
                          value={expressForm.left_reason}
                          onChange={(e) => setExpressForm({ ...expressForm, left_reason: e.target.value })}
                          className="w-full bg-white border border-rose-300 rounded-xl p-2 text-slate-900 font-medium outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-5 h-5 fill-slate-950" />
                      <span>SAVE STUDENT & NEXT ID ({getNextPermanentId(allMembers.length > 0 ? allMembers : existingMembers)})</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
            {isReadmissionMode && (
              <div className="bg-amber-900/10 border border-amber-300/80 rounded-2xl p-4 text-xs text-amber-900 font-bold flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Re-Admitting Existing Student ({formData.permanent_id} - {formData.full_name}). Lifetime payment history and profile will be seamlessly linked!</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-black shrink-0 transition-colors"
                >
                  Clear Re-Admission
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6">
            {/* Section 1: Personal Details */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-600" />
                <span>1. Personal & Identity Details</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">
                    Full Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Ankit Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Father&apos;s Name</label>
                  <input
                    type="text"
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">
                    Mobile Phone Number <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, mobile: val }));
                      const clean = val.replace(/\D/g, "");
                      if (clean.length >= 10) {
                        const match = existingMembers.find(m => m.mobile && String(m.mobile).replace(/\D/g, "") === clean);
                        if (match) {
                          setFoundPastStudent(match);
                          setLookupModalOpen(true);
                        }
                      }
                    }}
                    placeholder="9876543210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none focus:border-cyan-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none focus:border-cyan-500 font-bold"
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
                    value={formData.targeting_exam}
                    onChange={(e) => setFormData({ ...formData, targeting_exam: e.target.value })}
                    placeholder="e.g. UPSC CSE, NEET, CA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Aadhar Card Number</label>
                  <input
                    type="text"
                    value={formData.aadhar_no}
                    onChange={(e) => setFormData({ ...formData, aadhar_no: e.target.value })}
                    placeholder="1234-5678-9012"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-500 font-bold mb-1 block">Residential Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Sector / Society address"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Shift Plan & Submit */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Grid className="w-4 h-4 text-cyan-600" />
                  <span>2. Shift Selection, Custom Subscription Rate & Locker</span>
                </span>
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-500 font-bold mb-2 block">
                    Select Shift Access Plan <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { shift: "Full Day", title: "Full Day Access", time: "24 Hours Exclusive", price: "₹1,100 / mo" },
                      { shift: "Morning", title: "Morning Shift", time: "06:00 AM – 02:00 PM", price: "₹600 / mo" },
                      { shift: "Evening", title: "Evening Shift", time: "02:00 PM – 10:00 PM", price: "₹600 / mo" }
                    ].map(p => (
                      <div
                        key={p.shift}
                        onClick={() => handleShiftChange(p.shift)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                          formData.shift === p.shift
                            ? "bg-cyan-50/80 border-cyan-500 text-cyan-900 shadow-md"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div>
                          <p className="font-extrabold text-sm">{p.title}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{p.time}</p>
                        </div>
                        <p className="font-mono font-bold text-cyan-700 text-sm">{p.price}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Monthly Subscription Rate Field */}
                <div className="bg-cyan-50/60 p-4 rounded-2xl border border-cyan-200/80 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Monthly Subscription Price / Custom Rate (₹)</span>
                        <span className="text-[10px] text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full font-bold">Saved Permanently</span>
                      </label>
                      <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                        Default rate is auto-set by shift. Edit if taking a custom negotiated price (e.g. ₹800/mo). This rate becomes the student&apos;s permanent monthly plan amount!
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-black text-slate-400">₹</span>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.plan_amount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value || 0);
                          setFormData(prev => ({ ...prev, plan_amount: val }));
                        }}
                        className="w-36 bg-white border border-cyan-300 rounded-2xl p-2.5 text-sm font-mono font-black text-cyan-950 shadow-inner outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Locker Requested Switch (Yes / No) & Fee Control */}
                <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 text-xs block">Request Storage Locker Facility?</span>
                      <span className="text-[11px] text-slate-500">Locker will be assigned from Locker Map after registration</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextHasLocker = !formData.has_locker;
                        const fee = formData.locker_fee || 50;
                        let baseShiftPrice = 1100;
                        if (formData.shift === "Morning" || formData.shift === "Evening" || formData.shift === "Afternoon" || formData.shift === "Night") {
                          baseShiftPrice = 600;
                        }

                        setFormData(prev => ({
                          ...prev,
                          has_locker: nextHasLocker,
                          locker_fee: fee,
                          plan_amount: baseShiftPrice + (nextHasLocker ? fee : 0)
                        }));
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        formData.has_locker ? "bg-purple-600 text-white shadow-md" : "bg-white border border-slate-300 text-slate-600"
                      }`}
                    >
                      {formData.has_locker ? "Locker Requested (YES)" : "No Locker (NO)"}
                    </button>
                  </div>

                  {formData.has_locker && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 animate-fadeIn">
                      <label className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                        <span>Locker Fee Add-On (₹):</span>
                        <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-bold">Auto-added to Bill</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">₹</span>
                        <input
                          type="number"
                          value={formData.locker_fee || 50}
                          onChange={(e) => {
                            const newFee = parseFloat(e.target.value || 0);
                            const oldFee = parseFloat(formData.locker_fee || 0);
                            const diff = newFee - oldFee;
                            setFormData(prev => ({
                              ...prev,
                              locker_fee: newFee,
                              plan_amount: Math.max(0, prev.plan_amount + diff)
                            }));
                          }}
                          className="w-28 bg-white border border-purple-300 rounded-xl p-2 text-xs font-mono font-bold text-purple-900 outline-none focus:border-purple-600"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="w-full p-4 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Register Student & Manage Profile / Payment</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    ) : (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center space-y-6 shadow-md max-w-xl mx-auto relative">
            <button
              type="button"
              onClick={() => { setSubmittedMember(null); handleResetForm(); }}
              className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
              title="Close Confirmation"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Admission Registered Successfully!</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Student <strong className="text-slate-900">{submittedMember.full_name}</strong> registered under ID <strong className="text-cyan-700 font-mono">{submittedMember.permanent_id}</strong>.
              </p>
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-bold inline-block">
                Initial Fee Recorded as Dues: ₹{submittedMember.plan_amount || 1100} (Pending Payment)
              </div>
            </div>

            {/* Next Action CTAs */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => router.push(`/dashboard/record-payment?memberId=${submittedMember.id || ''}`)}
                className="w-full p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Collect & Record Fee Payment Now</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => router.push(`/dashboard/seating`)}
                  className="p-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-extrabold shadow-md cursor-pointer"
                >
                  Assign Seat
                </button>
                <button
                  onClick={() => {
                    const msg = formatWhatsAppMessage("welcome", {
                      student_name: submittedMember.full_name || "Student",
                      seat_no: submittedMember.seat_no || "Unassigned",
                      shift: submittedMember.shift || "Full Day",
                      expiry_date: submittedMember.subscription_end_date ? submittedMember.subscription_end_date.substring(0, 10) : "N/A"
                    });
                    openWhatsAppDirectMessage(submittedMember.mobile, msg);
                  }}
                  className="p-3 rounded-2xl bg-[#25D366] hover:bg-[#1db954] text-white text-xs font-extrabold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>WhatsApp Welcome</span>
                </button>
                <button
                  onClick={() => { setSubmittedMember(null); handleResetForm(); }}
                  className="p-3 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  + Next Admission
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setSubmittedMember(null); handleResetForm(); }}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-extrabold text-slate-600 cursor-pointer transition-colors"
              >
                Close / Done
              </button>
            </div>
          </div>
        )}

        {/* CENTER-SCREEN VIEWPORT MODAL DIALOG FOR EXISTING STUDENT DETECTED */}
        {lookupModalOpen && foundPastStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-popIn text-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-cyan-600" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Student Record Found in Database!</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setLookupModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Student Name:</span>
                  <span className="font-extrabold text-slate-900">{foundPastStudent.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Lifetime Permanent ID:</span>
                  <span className="font-mono font-bold text-cyan-700">{foundPastStudent.permanent_id || "MSL0001"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Mobile Phone:</span>
                  <span className="font-mono font-bold text-slate-800">{foundPastStudent.mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Father&apos;s Name:</span>
                  <span className="text-slate-800 font-medium">{foundPastStudent.father_name || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Current Record Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    foundPastStudent.status === 'LEFT' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {foundPastStudent.status || 'LEFT'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-bold text-center">
                How would you like to register this student?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleApplyExistingStudent(foundPastStudent);
                    setLookupModalOpen(false);
                  }}
                  className="p-4 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-extrabold text-xs text-center shadow-lg shadow-cyan-500/25 transition-all cursor-pointer space-y-1"
                >
                  <p className="font-black text-sm">Register as Existing Student</p>
                  <p className="text-[10px] opacity-90">Auto-fill profile & preserve MSL ID</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLookupModalOpen(false);
                  }}
                  className="p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs text-center border border-slate-200 transition-all cursor-pointer space-y-1"
                >
                  <p className="font-black text-sm">Register as New Student</p>
                  <p className="text-[10px] text-slate-500">Create new record with fresh ID</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

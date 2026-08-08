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
  Lock
} from "lucide-react";
import {
  fetchMembers,
  createMember,
  recordPayment,
  formatDate
} from "@/lib/adminService";

export default function NewAdmissionPage() {
  const router = useRouter();
  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState("2026-07");
  const [existingMembers, setExistingMembers] = useState([]);
  const [submittedMember, setSubmittedMember] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    permanent_id: "MS-2026-101",
    full_name: "",
    father_name: "",
    mobile: "",
    dob: "",
    gender: "Male",
    address: "",
    aadhar_no: "",
    targeting_exam: "UPSC CSE",
    shift: "Full Day",
    has_locker: false, // Locker toggle switch: Yes / No
    joining_date: "2026-08-08",
    duration_days: 30,
    plan_amount: 1000,
    discount_amount: 0,
    payment_status: "PAY_LATER", // Pay Later (Pending Dues) by default!
    deposit_amount: 0,
    payment_mode: "UPI",
    due_date: "2026-08-15"
  });

  // Auto-fill from Enquiry URL query params (Convert to Student feature!)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const nameParam = params.get("name") || params.get("fullName");
      const phoneParam = params.get("phone") || params.get("mobile");
      const shiftParam = params.get("shift") || params.get("interest");

      setFormData(prev => ({
        ...prev,
        permanent_id: "MS-2026-" + Math.floor(100 + Math.random() * 900),
        full_name: nameParam || prev.full_name,
        mobile: phoneParam || prev.mobile,
        shift: shiftParam || prev.shift,
        joining_date: formatDate(new Date()),
        due_date: formatDate(new Date(Date.now() + 7 * 86400000))
      }));
    }
  }, []);

  useEffect(() => {
    async function load() {
      const mList = await fetchMembers(activeBranch);
      setExistingMembers(mList);
    }
    load();
  }, [activeBranch]);

  // Update plan amount when shift changes
  const handleShiftChange = (shiftVal) => {
    let price = 1000;
    if (shiftVal === "Morning" || shiftVal === "Evening" || shiftVal === "Afternoon" || shiftVal === "Night") {
      price = 600;
    }
    setFormData(prev => ({ ...prev, shift: shiftVal, plan_amount: price }));
  };

  // Expiry date calculation
  const calculatedEndDate = () => {
    const start = new Date(formData.joining_date || new Date());
    start.setDate(start.getDate() + parseInt(formData.duration_days || 30));
    return formatDate(start);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalAmount = Math.max(0, formData.plan_amount - formData.discount_amount);
    const isPaid = formData.payment_status === "PAID";
    const isPartial = formData.payment_status === "PARTIAL";
    const collectedToday = isPaid ? finalAmount : (isPartial ? Math.min(finalAmount, parseFloat(formData.deposit_amount || 0)) : 0);
    const calculatedDues = Math.max(0, finalAmount - collectedToday);

    const memberPayload = {
      permanent_id: formData.permanent_id,
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
      seat_no: null, // Seat selection removed from Admission, assigned at Seat Map!
      has_locker: formData.has_locker,
      locker_no: null, // Locker selection removed from Admission, assigned at Locker Map!
      joining_date: formData.joining_date,
      subscription_end_date: calculatedEndDate(),
      plan_amount: finalAmount,
      outstanding_dues: calculatedDues,
      due_date: calculatedDues > 0 ? formData.due_date : null,
      left_with_dues: false,
      loss_amount: 0
    };

    const newMem = await createMember(memberPayload);

    if (collectedToday > 0) {
      await recordPayment({
        member_id: newMem.id,
        member_name: newMem.full_name,
        amount: collectedToday,
        branch: activeBranch,
        payment_mode: formData.payment_mode,
        notes: isPaid ? `Full Admission Fee (${formData.shift})` : `Partial Deposit on Admission (Remaining Dues ₹${calculatedDues})`,
        is_renewal: false,
        new_outstanding_dues: calculatedDues
      });
    }

    setSubmittedMember(newMem);
  };

  return (
    <DashboardLayout activeBranch={activeBranch} setActiveBranch={setActiveBranch} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}>
      <div className="max-w-4xl mx-auto space-y-8 animate-[fadeIn_0.3s_ease-out]">
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-600" />
              <span>New Student Admission Registration</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Register new student, select shift plan, configure billing & collect deposit</p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full bg-cyan-50 text-cyan-700 font-mono text-xs font-bold border border-cyan-200 shadow-sm">
            {formData.permanent_id}
          </span>
        </div>

        {!submittedMember ? (
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
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

            {/* Section 2: Shift Plan */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Grid className="w-4 h-4 text-cyan-600" />
                  <span>2. Shift Selection & Locker Request</span>
                </span>
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-500 font-bold mb-2 block">
                    Select Shift Access Plan <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { shift: "Full Day", title: "Full Day Access", time: "24 Hours Exclusive", price: "₹1,000 / mo" },
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

                {/* Locker Requested Switch (Yes / No) */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 text-xs block">Request Storage Locker Facility?</span>
                    <span className="text-[11px] text-slate-500">Locker will be assigned from Locker Map after registration</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, has_locker: !formData.has_locker })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      formData.has_locker ? "bg-purple-600 text-white shadow-md" : "bg-white border border-slate-300 text-slate-600"
                    }`}
                  >
                    {formData.has_locker ? "Locker Requested (YES)" : "No Locker (NO)"}
                  </button>
                </div>
              </div>
            </div>

            {/* Section 3: Billing & Deposit */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-600" />
                <span>3. Subscription Billing & Payment Collection</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">
                    Joining Date <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">
                    Duration (Days) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none focus:border-cyan-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Calculated Expiry Date</label>
                  <input
                    type="text"
                    disabled
                    value={calculatedEndDate()}
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl p-3 text-slate-600 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">
                    Plan Amount (₹) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.plan_amount}
                    onChange={(e) => setFormData({ ...formData, plan_amount: parseFloat(e.target.value || 0) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none focus:border-cyan-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Payment Mode & Status Selection */}
              <div className="space-y-4 pt-2 text-xs">
                <div>
                  <label className="text-slate-500 font-bold mb-2 block">
                    Payment Collection Status <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { status: "PAID", title: "Full Fee Paid Now", desc: "Collect 100% fee upfront" },
                      { status: "PARTIAL", title: "Partial Deposit Paid", desc: "Collect deposit now, balance in dues" },
                      { status: "PAY_LATER", title: "Pay Later (Dues Only)", desc: "Zero payment today, mark full dues" }
                    ].map(st => (
                      <div
                        key={st.status}
                        onClick={() => setFormData({ ...formData, payment_status: st.status })}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                          formData.payment_status === st.status
                            ? "bg-slate-900 text-white shadow-md border-slate-900"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <p className="font-extrabold text-sm">{st.title}</p>
                        <p className="text-[11px] opacity-70 font-medium">{st.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {formData.payment_status !== "PAY_LATER" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    {formData.payment_status === "PARTIAL" && (
                      <div>
                        <label className="text-slate-500 font-bold mb-1 block">
                          Deposit Collected Today (₹) <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          value={formData.deposit_amount}
                          onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                          placeholder="e.g. 400"
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 outline-none font-mono font-bold"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-slate-500 font-bold mb-1 block">
                        Payment Mode <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <select
                        value={formData.payment_mode}
                        onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 outline-none font-bold"
                      >
                        <option value="Cash">Cash Handover</option>
                        <option value="UPI">UPI / GPay / PhonePe</option>
                        <option value="Online">Online NetBanking</option>
                      </select>
                    </div>
                  </div>
                )}

                {formData.payment_status !== "PAID" && (
                  <div>
                    <label className="text-slate-500 font-bold mb-1 block">
                      Promised Dues Payment Deadline Date <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none focus:border-cyan-500 font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="w-full p-4 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Register & Confirm Student Admission</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Confirmation State */
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center space-y-6 shadow-md max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Admission Completed Successfully!</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Student <strong className="text-slate-900">{submittedMember.full_name}</strong> registered under ID <strong className="text-cyan-700 font-mono">{submittedMember.permanent_id}</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => router.push(`/dashboard/seating`)}
                className="p-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-extrabold shadow-md cursor-pointer"
              >
                Assign Seat on Map →
              </button>
              <button
                onClick={() => { setSubmittedMember(null); setFormData(prev => ({ ...prev, full_name: "", mobile: "" })); }}
                className="p-3 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                + Register Another Student
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

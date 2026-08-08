"use client";

import { useState } from "react";
import { CheckCircle2, Armchair, Loader2, Shield, Wifi, MapPin, Phone, User, Mail, Calendar, MessageSquare, ChevronDown } from "lucide-react";

const PERKS = [
  { icon: Shield, text: "Verified Silent Environment" },
  { icon: Armchair, text: "Premium Ergonomic Cabin" },
  { icon: Wifi, text: "1 Gbps Dedicated Fiber" },
  { icon: MapPin, text: "MG Road, Ambikapur" },
];

const SHIFTS = [
  { label: "Early Bird  (07:00 – 14:00)", price: "₹599 / mo", value: "Early Bird Shift (07:00 - 14:00)" },
  { label: "Mid-Day      (14:00 – 21:00)", price: "₹599 / mo", value: "Mid-Day Shift (14:00 - 21:00)" },
  { label: "Full Day     (07:00 – 22:00)", price: "₹1,099 / mo", value: "Full Day Sanctuary (07:00 - 22:00)" },
  { label: "Drop-In Daily Pass", price: "₹89 / day", value: "Drop-In Daily Pass" },
];

const SOURCES = ["Google Search", "Instagram", "Friend / Referral", "Pamphlet / Hoarding", "YouTube", "Other"];
const PURPOSES = ["UPSC / Govt Exam", "Academic Studies", "CA / Professional", "Competitive Entrance", "Work / Research", "Other"];

function Field({ label, icon: Icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 font-label-caps text-[10px] text-[#767872] uppercase tracking-widest font-bold">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-[#F5F3EF] border border-[#e0ddd8] rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#00A8CC] focus:border-transparent outline-none font-body text-sm text-[#1C2421] placeholder:text-[#b0ada8] transition-all duration-200";

import { supabase } from "@/lib/supabase";

export default function EnquiryForm() {
  const [form, setForm] = useState({
    name: "", mobile: "", email: "", shift: SHIFTS[2].value,
    purpose: "", source: "", message: "",
  });
  const [status, setStatus] = useState("idle");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile) return;
    setStatus("submitting");

    const newLead = {
      id: "lead-" + Date.now(),
      full_name: form.name,
      phone: form.mobile,
      interest: form.shift || "Full Day",
      status: "new",
      branch: "main_branch",
      notes: `Email: ${form.email || 'N/A'} | Exam: ${form.purpose || 'General'} | Source: ${form.source || 'Website'} | Note: ${form.message || 'N/A'}`,
      created_at: new Date().toISOString()
    };

    // 1. Save to LocalStorage mindspace_leads
    const existingLeads = JSON.parse(localStorage.getItem("mindspace_leads") || "[]");
    existingLeads.unshift(newLead);
    localStorage.setItem("mindspace_leads", JSON.stringify(existingLeads));

    // 2. Save to LocalStorage mindspace_enquiries
    const existingEnq = JSON.parse(localStorage.getItem("mindspace_enquiries") || "[]");
    existingEnq.unshift({
      id: newLead.id,
      ...form,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      status: "Pending",
    });
    localStorage.setItem("mindspace_enquiries", JSON.stringify(existingEnq));

    // 3. Sync to Supabase leads table
    try {
      await supabase.from('leads').insert([newLead]);
    } catch (err) {
      console.warn("Supabase lead insert error:", err);
    }

    setTimeout(() => {
      setStatus("success");
      setForm({ name: "", mobile: "", email: "", shift: SHIFTS[2].value, purpose: "", source: "", message: "" });
      setTimeout(() => setStatus("idle"), 5000);
    }, 1000);
  };

  return (
    <section id="lead-capture-crm-payload" className="w-full py-20 sm:py-28 bg-[#FDFBF7] relative overflow-hidden">
      {/* Faint grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#c6c7c0 1px, transparent 1px), linear-gradient(to right, #c6c7c0 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          opacity: 0.06,
        }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">

          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-10">
            {/* Eyebrow */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-label-caps text-[#00A8CC] text-xs tracking-widest uppercase font-bold">Limited Enrollment</span>
                <div className="w-10 h-px bg-[#00A8CC]" />
              </div>
              <h2 className="font-headline-lg text-4xl sm:text-5xl text-[#1C2421] leading-[1.05]" style={{ letterSpacing: "-0.025em" }}>
                Join the<br />
                <span className="text-[#00A8CC] italic">Sanctuary.</span>
              </h2>
              <p className="font-body text-sm text-[#454742] mt-4 leading-relaxed max-w-sm">
                Our intake is deliberately limited to preserve the silence every member deserves. Register below and our team will reach out within 24 hours.
              </p>
            </div>

            {/* Perks */}
            <div className="space-y-4">
              {PERKS.map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-[#00A8CC]/10 border border-[#00A8CC]/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#00A8CC]" />
                  </div>
                  <span className="font-body text-sm text-[#1C2421] font-semibold">{text}</span>
                </div>
              ))}
            </div>

            {/* Shift cards */}
            <div className="space-y-3">
              <p className="font-label-caps text-[10px] text-[#767872] uppercase tracking-widest font-bold mb-3">Available Plans</p>
              {SHIFTS.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, shift: s.value }))}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                    form.shift === s.value
                      ? "bg-[#1C2421] border-[#1C2421] text-white shadow-md"
                      : "bg-white border-[#e0ddd8] text-[#1C2421] hover:border-[#00A8CC]/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className={`w-4 h-4 ${form.shift === s.value ? "text-[#00A8CC]" : "text-[#767872]"}`} />
                    <span className="font-body text-sm font-semibold">{s.label}</span>
                  </div>
                  <span className={`font-label-caps text-xs font-bold ${form.shift === s.value ? "text-[#00A8CC]" : "text-[#767872]"}`}>
                    {s.price}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Right Column: Form ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-[32px] border border-[#e0ddd8] shadow-[0_8px_40px_rgba(0,0,0,0.07)] p-8 sm:p-10 relative overflow-hidden">
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00A8CC]/5 rounded-bl-[64px] pointer-events-none" />
              <div className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full bg-[#00A8CC]" />

              {status === "success" ? (
                <div className="flex flex-col items-center justify-center text-center py-16 gap-6">
                  <div className="w-20 h-20 rounded-full bg-[#00A8CC]/10 border-2 border-[#00A8CC] flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-[#00A8CC]" />
                  </div>
                  <div>
                    <h3 className="font-headline-md text-2xl text-[#1C2421] mb-2">Enrollment Requested!</h3>
                    <p className="font-body text-sm text-[#767872] max-w-xs mx-auto leading-relaxed">
                      We&apos;ve received your request. Our team will contact you within 24 hours to confirm your cabin.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  <div>
                    <h3 className="font-headline-md text-xl text-[#1C2421] mb-1">Your Details</h3>
                    <p className="font-body text-xs text-[#767872]">Fill in your information — we&apos;ll handle the rest.</p>
                  </div>

                  {/* Row 1: Name + Mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Full Name *" icon={User}>
                      <input required value={form.name} onChange={set("name")} className={inputCls} placeholder="Harsh Goyal" type="text" />
                    </Field>
                    <Field label="Phone Number *" icon={Phone}>
                      <input required value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/[^0-9+]/g, "") }))} className={inputCls} placeholder="+91 98765 43210" type="tel" />
                    </Field>
                  </div>

                  {/* Row 2: Email */}
                  <Field label="Email Address" icon={Mail}>
                    <input value={form.email} onChange={set("email")} className={inputCls} placeholder="you@example.com" type="email" />
                  </Field>

                  {/* Row 3: Purpose + Source */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Studying For" icon={ChevronDown}>
                      <div className="relative">
                        <select value={form.purpose} onChange={set("purpose")} className={`${inputCls} appearance-none cursor-pointer pr-10`}>
                          <option value="">Select purpose…</option>
                          {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b0ada8] pointer-events-none" />
                      </div>
                    </Field>
                    <Field label="How Did You Hear?" icon={ChevronDown}>
                      <div className="relative">
                        <select value={form.source} onChange={set("source")} className={`${inputCls} appearance-none cursor-pointer pr-10`}>
                          <option value="">Select source…</option>
                          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b0ada8] pointer-events-none" />
                      </div>
                    </Field>
                  </div>

                  {/* Shift (readonly display from left panel selection) */}
                  <Field label="Selected Plan" icon={Calendar}>
                    <div className={`${inputCls} bg-[#F5F3EF] flex items-center justify-between`}>
                      <span className="text-[#1C2421] font-semibold text-sm">{SHIFTS.find(s => s.value === form.shift)?.label || form.shift}</span>
                      <span className="font-label-caps text-xs text-[#00A8CC] font-bold">{SHIFTS.find(s => s.value === form.shift)?.price}</span>
                    </div>
                  </Field>

                  {/* Message */}
                  <Field label="Message / Special Request" icon={MessageSquare}>
                    <textarea
                      value={form.message}
                      onChange={set("message")}
                      className={`${inputCls} resize-none h-24`}
                      placeholder="Any specific cabin preference, questions, or notes for us…"
                    />
                  </Field>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full bg-[#1C2421] text-[#FDFBF7] font-label-caps text-sm py-5 rounded-2xl hover:bg-[#00A8CC] transition-all duration-300 shadow-lg tracking-widest font-bold cursor-pointer flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    {status === "submitting" ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /><span>Submitting…</span></>
                    ) : (
                      <span>Request Enrollment →</span>
                    )}
                  </button>

                  <p className="text-center font-body text-[11px] text-[#b0ada8] leading-relaxed">
                    By submitting you agree to be contacted by MindSpace Library team. Your data is kept private and never shared.
                  </p>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

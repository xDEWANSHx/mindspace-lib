"use client";

import { Check, X, Sparkles, ShieldCheck, Zap, Lock, Clock, Key } from "lucide-react";
import { useState } from "react";

const PLANS = [
  {
    name: "Daily Trial Pass",
    tagline: "Single Day Full-Day Access",
    price: "₹59",
    period: "/day",
    badge: "Single Day Pass",
    popular: false,
    icon: Clock,
    accent: "#D4B28C",
    features: [
      { text: "Full Day 24-Hour Trial Access", ok: true },
      { text: "Any Available Ergonomic Cabin", ok: true },
      { text: "1 Gbps High-Speed Fiber Wi-Fi", ok: true },
      { text: "Silent Air-Conditioned Environment", ok: true },
      { text: "24/7 Power Inverter Backup", ok: true },
      { text: "Personal Storage Locker", ok: false, note: "Add-on Available" },
    ],
    cta: "Get Day Pass",
  },
  {
    name: "Single Shift Plan",
    tagline: "Morning or Evening Shift",
    price: "₹599",
    period: "/month",
    badge: "8-Hour Shift",
    popular: false,
    icon: Zap,
    accent: "#00A8CC",
    features: [
      { text: "8-Hour Fixed Shift (Morning / Evening)", ok: true },
      { text: "Personal Ergonomic Study Desk", ok: true },
      { text: "1 Gbps High-Speed Fiber Wi-Fi", ok: true },
      { text: "Silent Air-Conditioned Environment", ok: true },
      { text: "24/7 Power Inverter Backup", ok: true },
      { text: "Personal Storage Locker", ok: false, note: "Add-on Available" },
    ],
    cta: "Select Shift Plan",
  },
  {
    name: "Full Day Sanctuary",
    tagline: "Unlimited 24-Hour Access",
    price: "₹1,099",
    period: "/month",
    badge: "Most Popular",
    popular: true,
    icon: Sparkles,
    accent: "#00A8CC",
    features: [
      { text: "Unlimited 24/7 Full-Day Access", ok: true },
      { text: "Dedicated Permanent Study Cabin", ok: true },
      { text: "1 Gbps Ultra-Fast Fiber Wi-Fi", ok: true },
      { text: "Quiet Ambient Lighting & Acoustics", ok: true },
      { text: "24/7 Power & AC Backup Guarantee", ok: true },
      { text: "Personal Storage Locker", ok: false, note: "Add-on Available" },
    ],
    cta: "Claim Sanctuary Desk",
  },
];

export default function PricingPlans() {
  const [hovered, setHovered] = useState(null);

  const scrollToForm = () => {
    const el = document.getElementById("lead-capture-crm-payload");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="membership-plans" className="w-full py-24 sm:py-32 relative overflow-hidden bg-[#111714] text-white">
      {/* ── Dark Ambient Texture & Subtle Glows ── */}
      {/* Top Ambient Cyan Glow Spotlight */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none opacity-20 blur-[120px] rounded-full"
        style={{ background: "radial-gradient(circle, #00A8CC 0%, transparent 70%)" }}
      />

      {/* Subtle Dotted Matrix Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage: "radial-gradient(circle, #00A8CC 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Faint Horizontal Accent Lines */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#00A8CC]/40 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#D4B28C]/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 relative z-10">

        {/* ── Section Header ── */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00A8CC]/10 border border-[#00A8CC]/30 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#00A8CC] animate-pulse" />
            <span className="font-label-caps text-[#00A8CC] font-extrabold tracking-[0.25em] uppercase text-[10px] sm:text-xs">
              Transparent Membership Plans
            </span>
          </div>
          <h2 className="font-headline-lg text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight">
            Invest in Your <span className="text-[#00A8CC] italic">Focus &amp; Discipline</span>
          </h2>
          <p className="font-body text-xs sm:text-sm text-[#a3a8a3] mt-4 max-w-md mx-auto leading-relaxed">
            No registration charges or hidden fees. Choose your preferred shift or daily pass tailored for Ambikapur aspirants.
          </p>
        </div>

        {/* ── 3 Pricing Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-16">
          {PLANS.map((plan, idx) => {
            const isFeatured = plan.popular;
            const PlanIcon = plan.icon;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                className={`relative rounded-[36px] p-8 sm:p-10 flex flex-col justify-between transition-all duration-500 cursor-default ${
                  isFeatured
                    ? "bg-[#18231F] text-white shadow-[0_24px_70px_rgba(0,168,204,0.25)] border-2 border-[#00A8CC] scale-[1.04] z-20"
                    : "bg-[#161D1A]/90 border border-white/10 text-white shadow-xl hover:border-[#00A8CC]/50 hover:-translate-y-1.5 z-10"
                }`}
              >
                {/* Top Badge */}
                {plan.badge && (
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full font-label-caps text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-lg ${
                      isFeatured
                        ? "bg-[#00A8CC] text-white cyan-glow"
                        : "bg-[#D4B28C] text-[#1C2421]"
                    }`}
                  >
                    {plan.badge}
                  </div>
                )}

                {/* Card Content Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-label-caps text-[10px] uppercase tracking-widest font-extrabold text-[#00A8CC]">
                      {plan.tagline}
                    </span>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isFeatured
                          ? "bg-[#00A8CC]/20 text-[#00A8CC] border border-[#00A8CC]/40"
                          : "bg-white/5 text-[#D4B28C] border border-white/10"
                      }`}
                    >
                      <PlanIcon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="font-headline-md text-2xl sm:text-3xl mb-4 font-bold text-white">
                    {plan.name}
                  </h3>

                  <div className="flex items-end gap-1.5 mb-6 pb-6 border-b border-white/10">
                    <span className="font-headline-lg text-4xl sm:text-5xl font-black text-white">
                      {plan.price}
                    </span>
                    <span className="font-label-caps text-xs pb-2 font-bold text-[#a3a8a3]">
                      {plan.period}
                    </span>
                  </div>

                  {/* Features Checklist */}
                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className={`flex items-center justify-between gap-3${!f.ok ? " opacity-45" : ""}`}>
                        <div className="flex items-center gap-3">
                          {f.ok ? (
                            <div className="w-5 h-5 rounded-full bg-[#00A8CC]/20 text-[#00A8CC] border border-[#00A8CC]/40 flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center shrink-0">
                              <X className="w-3.5 h-3.5" strokeWidth={2} />
                            </div>
                          )}
                          <span className="font-body text-xs sm:text-sm font-medium text-white/90">
                            {f.text}
                          </span>
                        </div>

                        {f.note && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-label-caps text-[9px] uppercase font-bold shrink-0">
                            {f.note}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={scrollToForm}
                  className={`w-full py-4 rounded-full font-label-caps text-xs uppercase tracking-widest font-black transition-all duration-300 cursor-pointer shadow-lg hover:scale-105 active:scale-[0.98] ${
                    isFeatured
                      ? "bg-[#00A8CC] text-white hover:bg-[#0284c7] cyan-glow"
                      : "bg-white/10 text-white hover:bg-[#00A8CC] hover:text-white border border-white/15"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Dedicated Premium Locker Add-On Banner ── */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-[#18231F] border border-[#D4B28C]/40 shadow-xl overflow-hidden mb-12">
          {/* Subtle Accent Glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#D4B28C]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D4B28C]/20 border border-[#D4B28C]/40 flex items-center justify-center text-[#D4B28C] shrink-0">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-headline-md text-base sm:text-lg font-bold text-white">
                    Personal Keyed Locker Access
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#D4B28C]/20 text-[#D4B28C] border border-[#D4B28C]/30 font-label-caps text-[9px] uppercase font-black tracking-wider">
                    Separate Add-On
                  </span>
                </div>
                <p className="font-body text-xs sm:text-sm text-[#a3a8a3] max-w-xl leading-relaxed">
                  Personal storage lockers are excluded from standard seat plans and can be purchased extensively as an add-on to any plan for dedicated 1:1 secure storage of heavy textbooks and belongings.
                </p>
              </div>
            </div>

            <button
              onClick={scrollToForm}
              className="px-6 py-3.5 rounded-full bg-[#D4B28C] hover:bg-[#c5a17b] text-[#1C2421] font-label-caps text-xs uppercase tracking-wider font-black shrink-0 transition-all shadow-md hover:scale-105 cursor-pointer flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Inquire Locker Add-On</span>
            </button>
          </div>
        </div>

        {/* ── Bottom Guarantee Note ── */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-[#a3a8a3]">
          <ShieldCheck className="w-5 h-5 text-[#00A8CC] shrink-0" />
          <span>All plans include 1 Gbps Fiber WiFi, AC environment, 24/7 power backup guarantee &amp; RO purified water.</span>
        </div>

      </div>
    </section>
  );
}

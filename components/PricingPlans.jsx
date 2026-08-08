"use client";

import { Check, X, Sparkles, ShieldCheck, Zap, Lock } from "lucide-react";
import { useState } from "react";

const PLANS = [
  {
    name: "Shift Access Plan",
    tagline: "Morning / Evening / Night Shift",
    price: "₹599",
    period: "/month",
    color: "light",
    badge: "Flexible Hours",
    popular: false,
    icon: Zap,
    features: [
      { text: "8-Hour Fixed Shift Access", ok: true },
      { text: "Personal Ergonomic Cabin Desk", ok: true },
      { text: "1 Gbps High-Speed Fiber Wi-Fi", ok: true },
      { text: "Silent Air-Conditioned Environment", ok: true },
      { text: "24/7 Power Inverter Backup", ok: true },
      { text: "Personal Storage Locker", ok: false },
      { text: "Noiric Cafe 10% Member Perk", ok: false },
    ],
    cta: "Select Shift Plan",
  },
  {
    name: "Full Day Sanctuary",
    tagline: "Unlimited 24-Hour Access",
    price: "₹1,000",
    period: "/month",
    color: "dark",
    badge: "Most Popular",
    popular: true,
    icon: Sparkles,
    features: [
      { text: "Full Day Unlimited Access (24 Hours)", ok: true },
      { text: "Dedicated Personal Study Cabin", ok: true },
      { text: "1 Gbps Ultra-Fast Fiber Wi-Fi", ok: true },
      { text: "Noiric Cafe 10% Member Discount", ok: true },
      { text: "Priority Storage Locker Access", ok: true },
      { text: "Quiet Ambient Lighting & Acoustics", ok: true },
      { text: "24/7 Power & AC Backup Guarantee", ok: true },
    ],
    cta: "Claim Sanctuary Desk",
  },
  {
    name: "VIP Reserved Locker + Desk",
    tagline: "Exclusive Reserved Cabin & Locker",
    price: "₹1,499",
    period: "/month",
    color: "light",
    badge: "VIP Premium",
    popular: false,
    icon: ShieldCheck,
    features: [
      { text: "Guaranteed Reserved Fixed Cabin", ok: true },
      { text: "Personal Locker Key Assigned (1:1)", ok: true },
      { text: "Unlimited 24/7 Priority Access", ok: true },
      { text: "Noiric Cafe 15% VIP Discount", ok: true },
      { text: "Dedicated Power Terminal & Desk Lamp", ok: true },
      { text: "Free Weekly Desk Sanitization", ok: true },
      { text: "Priority Seat Lock Security", ok: true },
    ],
    cta: "Reserve VIP Locker Plan",
  },
];

export default function PricingPlans() {
  const [hovered, setHovered] = useState(null);

  const scrollToForm = () => {
    const el = document.getElementById("lead-capture-crm-payload");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="membership-plans" className="w-full py-24 sm:py-32 relative overflow-hidden bg-[#FDFBF7]">
      {/* Faint dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #1C2421 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 relative z-10">

        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <span className="font-label-caps text-[#00A8CC] font-bold tracking-[0.3em] uppercase text-xs mb-3 block">
            Invest in Your Success
          </span>
          <h2 className="font-headline-lg text-4xl sm:text-5xl lg:text-6xl text-[#1C2421]" style={{ letterSpacing: "-0.02em" }}>
            Transparent Membership Plans
          </h2>
          <p className="font-body text-sm text-[#454742] mt-4 max-w-md mx-auto leading-relaxed">
            No hidden fees or registration charges. Choose the plan that fits your preparation routine in Ambikapur.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {PLANS.map((plan, idx) => {
            const isDark = plan.color === "dark";
            const PlanIcon = plan.icon;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                className={`relative rounded-[36px] p-8 sm:p-10 flex flex-col justify-between transition-all duration-500 cursor-default ${
                  isDark
                    ? "bg-[#1C2421] text-white shadow-[0_24px_60px_rgba(0,168,204,0.2)] border-2 border-[#00A8CC] scale-[1.03] z-20"
                    : "bg-white border border-[#c6c7c0]/50 shadow-md hover:shadow-2xl hover:-translate-y-1.5 z-10"
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full font-label-caps text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-md ${
                    isDark ? "bg-[#00A8CC] text-white" : "bg-[#D4B28C] text-[#2A1801]"
                  }`}>
                    {plan.badge}
                  </div>
                )}

                {/* Plan Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-label-caps text-[10px] uppercase tracking-widest font-extrabold ${isDark ? "text-[#00A8CC]" : "text-[#00A8CC]"}`}>
                      {plan.tagline}
                    </span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? "bg-[#00A8CC]/20 text-[#00A8CC]" : "bg-slate-100 text-slate-700"}`}>
                      <PlanIcon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className={`font-headline-md text-2xl sm:text-3xl mb-4 font-bold ${isDark ? "text-white" : "text-[#1C2421]"}`}>
                    {plan.name}
                  </h3>

                  <div className="flex items-end gap-1.5 mb-6 pb-6 border-b border-current/10">
                    <span className={`font-headline-lg text-4xl sm:text-5xl font-black ${isDark ? "text-white" : "text-[#1C2421]"}`}>
                      {plan.price}
                    </span>
                    <span className={`font-label-caps text-xs pb-2 font-bold ${isDark ? "text-white/50" : "text-[#767872]"}`}>
                      {plan.period}
                    </span>
                  </div>

                  {/* Features Checklist */}
                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className={`flex items-center gap-3 ${!f.ok ? "opacity-35" : ""}`}>
                        {f.ok ? (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-[#00A8CC]/20 text-[#00A8CC]" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <X className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                          </div>
                        )}
                        <span className={`font-body text-xs sm:text-sm font-medium ${isDark ? "text-white/90" : "text-[#151d1a]/80"}`}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button with Micro-Interaction Ripple / Shine */}
                <button
                  onClick={scrollToForm}
                  className={`w-full py-4 rounded-full font-label-caps text-xs uppercase tracking-widest font-black transition-all duration-300 cursor-pointer shadow-lg hover:scale-105 active:scale-[0.98] ${
                    isDark
                      ? "bg-[#00A8CC] text-white hover:bg-[#0284c7] cyan-glow"
                      : "bg-[#1C2421] text-white hover:bg-[#00A8CC]"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Guarantee Note */}
        <div className="mt-14 p-6 rounded-3xl bg-white border border-[#c6c7c0]/40 text-center max-w-2xl mx-auto shadow-sm flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-[#454742]">
          <ShieldCheck className="w-5 h-5 text-[#00A8CC] shrink-0" />
          <span>All plans include 1 Gbps Fiber WiFi, AC environment, 24/7 power backup guarantee &amp; RO purified water.</span>
        </div>

      </div>
    </section>
  );
}

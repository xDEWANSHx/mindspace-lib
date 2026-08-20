"use client";

import { useEffect, useRef, useState } from "react";
import { Armchair, Wifi, Moon, Zap, Droplets, Sparkles } from "lucide-react";

/* Card data — each has Lucide icon components, background watermark SVG, badge, and pastel styling */
const CARDS = [
  {
    badge: "Available Now",
    badgeDot: "#22c55e",
    title: "Silent Cabins",
    body: "100+ individual ergonomic workstations — personal space, zero disturbance. Deep work starts here.",
    cta: "Reserve a seat",
    bg: "#FFF9EC",
    border: "#fde68a",
    icon: Armchair,
    iconColor: "#b45309",
    iconBg: "#fef3c7",
  },
  {
    badge: "Always Active",
    badgeDot: "#00A8CC",
    title: "1 Gbps Fiber",
    body: "Dual fiber-optic lines with automatic failover. Stream, test, download — never throttled.",
    cta: "Check connectivity",
    bg: "#F0FAFF",
    border: "#bae6fd",
    icon: Wifi,
    iconColor: "#0284c7",
    iconBg: "#e0f2fe",
  },
  {
    badge: "Dual Mode",
    badgeDot: "#a78bfa",
    title: "Dark & Light Rooms",
    body: "Bright daylight hall for fresh energy. Moody dark room for deep concentration. Switch anytime.",
    cta: "Choose your vibe",
    bg: "#FAF5FF",
    icon: Moon,
    iconColor: "#7c3aed",
    iconBg: "#ede9fe",
  },
  {
    badge: "24/7 Powered",
    badgeDot: "#f59e0b",
    title: "Inverter Backup",
    body: "Full inverter on every desk. Power outages are invisible here — your screen stays on, always.",
    cta: "Never worry again",
    bg: "#FFFBEB",
    icon: Zap,
    iconColor: "#d97706",
    iconBg: "#fef3c7",
  },
  {
    badge: "Complimentary",
    badgeDot: "#0284c7",
    title: "Clean Water Facility",
    body: "Unlimited 100% chilled & normal RO purified drinking water facility for every student, 24/7.",
    cta: "Explore amenities",
    bg: "#F0FAFF",
    border: "#bae6fd",
    icon: Droplets,
    iconColor: "#0284c7",
    iconBg: "#e0f2fe",
  },
  {
    badge: "Coming Soon",
    badgeDot: "#ec4899",
    title: "Premium Lounge",
    body: "Ambikapur's finest relaxation space — velvet seating, curated books, and calming ambiance.",
    cta: "Get notified",
    bg: "#FFF0F9",
    border: "#fbcfe8",
    icon: Sparkles,
    iconColor: "#db2777",
    iconBg: "#fce7f3",
  },
];

export default function CoBrandSynergy() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const scrollToForm = () => {
    const el = document.getElementById("lead-capture-crm-payload");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="co-brand-pantry-matrix" ref={ref} className="w-full bg-[#FDFBF7] py-20 sm:py-28 relative overflow-hidden">
      {/* Faint dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.2]"
        style={{
          backgroundImage: "radial-gradient(circle, #c6c7c0 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 relative z-10">

        {/* Header */}
        <div
          className="mb-14 sm:mb-16 transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
        >
          <p className="font-label-caps text-xs text-[#D4B28C] tracking-widest uppercase font-bold mb-3">
            What Makes Us Different
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <h2
              className="font-headline-lg text-4xl sm:text-5xl lg:text-6xl text-[#1C2421]"
              style={{ letterSpacing: "-0.03em" }}
            >
              The MindSpace<br />Experience.
            </h2>
            <p className="font-body text-sm text-[#767872] max-w-xs leading-relaxed sm:text-right">
              From air to fiber to ergonomic seating — every detail is engineered for your focus.
            </p>
          </div>
        </div>

        {/* 2×3 Card Grid with Hover Tilt & Large Watermark SVGs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CARDS.map((card, idx) => {
            const Icon = card.icon;
            // Alternate subtle tilt angles for hover micro-interaction
            const tiltClass = idx % 2 === 0 ? "hover:-rotate-1" : "hover:rotate-1";

            return (
              <div
                key={idx}
                className={`group relative rounded-[28px] p-8 flex flex-col justify-between gap-8 cursor-default transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 hover:shadow-2xl overflow-hidden ${tiltClass}`}
                style={{
                  background: card.bg,
                  border: `1.5px solid ${card.border}`,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "none" : "translateY(28px)",
                  transition: `opacity 0.5s ease-out ${idx * 0.07}s, transform 0.5s ease-out ${idx * 0.07}s, box-shadow 0.3s`,
                }}
              >
                {/* Large Background SVG Watermark in bottom-right corner */}
                <Icon
                  className="absolute -bottom-6 -right-6 w-44 h-44 opacity-10 group-hover:opacity-20 group-hover:scale-125 transition-all duration-500 pointer-events-none"
                  style={{ color: card.iconColor }}
                />

                {/* Top: badge dot + label + Icon Bubble */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
                      style={{ background: card.badgeDot }}
                    />
                    <span className="font-label-caps text-[10px] text-[#454742] uppercase tracking-widest font-bold">
                      {card.badge}
                    </span>
                  </div>

                  {/* Icon bubble */}
                  <div
                    className="w-13 h-13 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12"
                    style={{ background: card.iconBg }}
                  >
                    <Icon className="w-6 h-6" style={{ color: card.iconColor }} />
                  </div>
                </div>

                {/* Body */}
                <div className="relative z-10">
                  <h3
                    className="font-headline-md text-xl sm:text-2xl text-[#1C2421] mb-3"
                    style={{ letterSpacing: "-0.01em" }}
                  >
                    {card.title}
                  </h3>
                  <p className="font-body text-sm text-[#454742] leading-relaxed">
                    {card.body}
                  </p>
                </div>

                {/* CTA */}
                <button
                  onClick={scrollToForm}
                  className="relative z-10 flex items-center gap-2 font-label-caps text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer group/cta w-fit"
                  style={{ color: card.iconColor }}
                >
                  <span>{card.cta}</span>
                  <svg
                    className="w-3.5 h-3.5 group-hover/cta:translate-x-1.5 transition-transform"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

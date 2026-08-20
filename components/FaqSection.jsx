"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Minus, MessageCircle, ArrowRight, HelpCircle, Sparkles } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "What are the operating hours?",
    a: "MindSpace is open 7 days a week, from 07:00 AM to 10:00 PM. Full-Day members get unrestricted access during all operating hours with no booking required.",
  },
  {
    q: "Can I reserve a fixed personal cabin?",
    a: "Yes. Full-Day plan subscribers get a permanently assigned, dedicated workstation with a personal storage locker. Your cabin stays yours every single day.",
  },
  {
    q: "Are food & beverages allowed at the desk?",
    a: "We have a dedicated clean pantry space for meals and refreshment breaks. Drinks in covered bottles/flasks are allowed at study desks to preserve a clean environment.",
  },
  {
    q: "What internet speed is available?",
    a: "We maintain dual 1 Gbps fiber-optic lines with automatic failover redundancy. Zero lag for HD video lectures, live test series, and bulk downloads.",
  },
  {
    q: "Is silence strictly enforced?",
    a: "Absolution in silence is our core identity. No phone calls or chatter inside focus halls. We maintain soundproof discussion pods outside for breaks.",
  },
  {
    q: "Do you offer a trial or single-day pass?",
    a: "Yes — our Drop-In Daily Pass is ₹89/day. Register via the enquiry form and we'll confirm your trial slot. Experience the sanctuary before committing to a monthly plan.",
  },
  {
    q: "What happens during a power outage?",
    a: "Nothing. Every desk is connected to full inverter backup. Grid failure is completely invisible to you — your screen stays on, your session continues uninterrupted.",
  },
];

const TRUST = [
  { num: "18+", label: "5-Star Google reviews" },
  { num: "100%", label: "Inverter-backed desks" },
  { num: "4.9", label: "Average rating" },
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="faq-section" ref={sectionRef} className="w-full bg-[#FDFBF7] relative overflow-hidden py-20 sm:py-28">
      {/* Faint grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#c6c7c0 1px, transparent 1px), linear-gradient(to right, #c6c7c0 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          opacity: 0.07,
        }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-14 lg:gap-20 items-start">

          {/* ── LEFT: High-Impact Hook Panel with 500px 50% Opacity Yellow Q & 20px White Margin around A ─────────────── */}
          <div
            className="lg:col-span-2 lg:sticky lg:top-32 relative overflow-hidden p-6 sm:p-8 rounded-[32px] bg-[#FDFBF7] border border-[#e0ddd8] shadow-sm"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
            }}
          >
            {/* Background Watermark Icon */}
            <HelpCircle className="absolute -bottom-8 -right-8 w-48 h-48 text-[#F59E0B]/10 pointer-events-none" />

            {/* Hook Badge Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#D97706] font-label-caps text-[10px] uppercase font-bold tracking-widest mb-6 relative z-30">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Clear Your Doubts</span>
            </div>

            {/* Giant Typographic Hook: 500px 50% Opacity Yellow Q with 20px white outline margin around A */}
            <div className="relative mb-8 min-h-[160px] flex items-center">
              {/* Foreground 'F' and 'A' sitting on top (z-20) with 20px white character stroke outline margin */}
              <div
                className="font-headline-lg font-black leading-none select-none flex items-center tracking-tighter relative z-20"
                style={{
                  fontSize: "clamp(90px, 12vw, 140px)",
                  lineHeight: 0.85,
                }}
              >
                <span className="text-[#1C2421]">F</span>
                <span
                  className="text-[#00A8CC] relative inline-block"
                  style={{
                    WebkitTextStroke: "20px #FDFBF7",
                    paintOrder: "stroke fill",
                  }}
                >
                  A
                </span>
              </div>

              {/* Massive 500px Yellow 'Q' at 50% opacity positioned behind A */}
              <span
                className="absolute top-1/2 -translate-y-1/2 left-[100px] sm:left-[120px] font-headline-lg font-black select-none pointer-events-none z-10 transition-all duration-700"
                style={{
                  fontSize: "clamp(300px, 40vw, 480px)",
                  lineHeight: 0.75,
                  color: "rgba(245, 158, 11, 0.5)", // 50% opacity
                  filter: "drop-shadow(0 12px 40px rgba(245, 158, 11, 0.2))",
                }}
              >
                Q
              </span>
            </div>

            {/* Subtitle */}
            <h2
              className="font-headline-lg text-2xl sm:text-3xl text-[#1C2421] leading-tight mb-4 relative z-30"
              style={{ letterSpacing: "-0.02em" }}
            >
              Everything you need<br />
              <span className="text-[#00A8CC]">to know</span> before joining.
            </h2>

            <p className="font-body text-xs sm:text-sm text-[#767872] leading-relaxed max-w-xs mb-8 relative z-30">
              Got specific requirements or study schedules? Our team is always available for a free walkthrough.
            </p>

            {/* Trust mini-stats */}
            <div className="grid grid-cols-3 gap-3 mb-8 p-3 bg-white rounded-2xl border border-[#c6c7c0]/30 relative z-30 shadow-sm">
              {TRUST.map(({ num, label }) => (
                <div key={label} className="text-center">
                  <span className="font-headline-md text-lg font-black text-[#1C2421] block">{num}</span>
                  <span className="font-label-caps text-[8px] text-[#767872] uppercase font-bold leading-tight block mt-0.5">{label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                const el = document.getElementById("lead-capture-crm-payload");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="group inline-flex items-center gap-3 px-6 py-3.5 bg-[#1C2421] text-white rounded-full font-label-caps text-xs uppercase tracking-widest font-bold hover:bg-[#00A8CC] transition-all duration-300 shadow-md cursor-pointer hover:scale-105 active:scale-95 relative z-30"
            >
              <MessageCircle className="w-4 h-4 text-[#F59E0B]" />
              <span>Ask Us Anything</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* ── RIGHT: Accordion ─────────────────────────────── */}
          <div className="lg:col-span-3 space-y-0">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div
                  key={idx}
                  className="border-b border-[#e0ddd8] last:border-none"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateX(0)" : "translateX(20px)",
                    transition: `opacity 0.5s ease-out ${0.1 + idx * 0.06}s, transform 0.5s ease-out ${0.1 + idx * 0.06}s`,
                  }}
                >
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-6 py-6 text-left group cursor-pointer"
                  >
                    <span
                      className="font-headline-md text-base sm:text-lg leading-snug transition-colors duration-200"
                      style={{ color: isOpen ? "#00A8CC" : "#1C2421" }}
                    >
                      {item.q}
                    </span>
                    <div
                      className="shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300"
                      style={{
                        background: isOpen ? "#00A8CC" : "transparent",
                        borderColor: isOpen ? "#00A8CC" : "#c6c7c0",
                      }}
                    >
                      {isOpen
                        ? <Minus className="w-3.5 h-3.5 text-white" />
                        : <Plus className="w-3.5 h-3.5 text-[#767872] group-hover:text-[#1C2421] transition-colors" />
                      }
                    </div>
                  </button>

                  <div
                    className="overflow-hidden transition-all duration-400 ease-in-out"
                    style={{ maxHeight: isOpen ? "280px" : "0px", opacity: isOpen ? 1 : 0 }}
                  >
                    <p className="font-body text-sm text-[#454742] leading-relaxed pb-6 max-w-lg">
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}

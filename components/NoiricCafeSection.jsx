"use client";

import Image from "next/image";
import { QrCode, Tag, Coffee, Sparkles, CheckCircle2 } from "lucide-react";

export default function NoiricCafeSection() {
  const scrollToForm = () => {
    const el = document.getElementById("lead-capture-crm-payload");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="noiric-cafe-section" className="w-full py-24 sm:py-32 text-[#FDFBF7] relative overflow-hidden bg-[#140C07]">
      {/* ── Dark Roasted Espresso Background Gradient & Cafe Texture ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1C120B] via-[#140C07] to-[#0B0603]" />

      {/* Coffee Texture 1: Asfalt Grain */}
      <div
        className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/asfalt-dark.png')",
        }}
      />

      {/* Coffee Texture 2: Cafe Radial Warm Dots */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage: "radial-gradient(circle, #D4B28C 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Coffee Texture 3: Floating Watermark Coffee Bean Icons */}
      <div className="absolute top-12 left-10 text-[#D4B28C]/[0.05] pointer-events-none select-none">
        <Coffee className="w-64 h-64 rotate-12" />
      </div>
      <div className="absolute bottom-10 right-10 text-[#D4B28C]/[0.05] pointer-events-none select-none">
        <Coffee className="w-72 h-72 -rotate-45" />
      </div>

      {/* Warm Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[400px] bg-[#D4B28C]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-[#00A8CC]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* NOIRIC x MINDSPACE — large background watermark */}
      <span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none text-white/[0.035] font-black tracking-tighter leading-none whitespace-nowrap text-center"
        style={{ fontSize: "clamp(36px, 8vw, 110px)", fontFamily: "var(--font-anybody, sans-serif)" }}
      >
        NOIRIC × MINDSPACE
      </span>

      <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 relative z-10">

        {/* Section Header Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-14">
          <div className="inline-flex items-center gap-3">
            <span className="font-label-caps text-[#00A8CC] text-xs tracking-widest uppercase font-bold">
              Artisanal Coffee &amp; Study Synergy
            </span>
            <div className="w-12 h-px bg-[#00A8CC]" />
          </div>
          <div
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-[#D4B28C]/30 bg-[#D4B28C]/10 backdrop-blur-md shadow-lg"
            style={{ animation: "subtlePulse 4s ease-in-out infinite" }}
          >
            <Coffee className="w-4 h-4 text-[#D4B28C]" />
            <span className="font-headline-md text-[#D4B28C] font-black tracking-widest text-sm sm:text-base uppercase">
              NOIRIC CAFÉ
            </span>
            <span className="text-white/40 font-light text-lg">×</span>
            <span className="font-headline-md text-white font-black tracking-widest text-sm sm:text-base uppercase">
              MINDSPACE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-20 items-center">

          {/* Left Column: Content */}
          <div className="space-y-8 text-left">

            {/* Headline */}
            <div className="space-y-4">
              <h2 className="font-headline-lg text-4xl sm:text-5xl md:text-6xl text-[#FDFBF7] leading-tight">
                Noiric Cafe <br />
                <span className="text-[#D4B28C] italic underline decoration-[#00A8CC]/40 decoration-8 underline-offset-[12px]">
                  at Your Desk.
                </span>
              </h2>
              <p className="font-body text-sm sm:text-base md:text-lg text-white/70 max-w-md leading-relaxed">
                Seamlessly bridging the gap between deep work and artisanal caffeine culture.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-5">

              {/* Feature 1 */}
              <div className="flex items-start gap-5 bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
                <div className="w-14 h-14 bg-[#00A8CC]/20 rounded-2xl flex items-center justify-center border border-[#00A8CC]/30 shrink-0 group-hover:scale-110 group-hover:bg-[#00A8CC]/30 transition-all duration-300">
                  <QrCode className="w-7 h-7 text-[#00A8CC]" />
                </div>
                <div>
                  <h4 className="font-headline-md text-base sm:text-lg text-white mb-1 uppercase tracking-wide flex items-center gap-2">
                    <span>Scan-to-Order System</span>
                  </h4>
                  <p className="font-body text-xs sm:text-sm text-white/60 leading-relaxed">
                    Every cabin features a unique QR code. Order your favorite artisanal coffee or healthy snacks without ever leaving your seat.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-5 bg-[#D4B28C]/10 p-6 rounded-3xl border border-[#D4B28C]/20 hover:bg-[#D4B28C]/15 hover:border-[#D4B28C]/30 transition-all duration-300 group">
                <div className="w-14 h-14 bg-[#D4B28C]/20 rounded-2xl flex items-center justify-center border border-[#D4B28C]/30 shrink-0 group-hover:scale-110 group-hover:bg-[#D4B28C]/30 transition-all duration-300">
                  <Tag className="w-7 h-7 text-[#D4B28C]" />
                </div>
                <div>
                  <h4 className="font-headline-md text-base sm:text-lg text-white mb-1 uppercase tracking-wide">
                    The Sanctuary Perk
                  </h4>
                  <p className="font-body text-xs sm:text-sm text-white/70 leading-relaxed">
                    MindSpace Sanctuary members enjoy a flat <span className="text-[#00A8CC] font-bold">10% discount</span> on the entire Noiric menu, delivered straight to their desk.
                  </p>
                </div>
              </div>

            </div>

            {/* CTA */}
            <div className="pt-2">
              <button
                onClick={scrollToForm}
                className="px-8 py-4 bg-[#D4B28C] text-[#2A1801] font-label-caps text-xs uppercase tracking-widest font-bold rounded-full shadow-xl hover:bg-white hover:scale-105 transition-all duration-300 cursor-pointer active:scale-[0.97]"
              >
                Join &amp; Unlock Cafe Perks
              </button>
            </div>

          </div>

          {/* Right Column: Visual Image & Mastered Menu Highlight Floating Card */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-[40px] sm:rounded-[48px] overflow-hidden wood-stroke shadow-[0_40px_80px_rgba(0,0,0,0.7)] relative group">
              <Image
                src="/assets/feature_table_delivery.png"
                alt="Noiric Cafe Collaboration"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0603] via-transparent to-transparent opacity-80" />

              {/* Mastered Menu Highlight Floating Card (10/10 Design, Readable & Luxurious) */}
              <div className="absolute bottom-6 left-6 right-6 p-6 sm:p-7 bg-[#1A120A]/95 backdrop-blur-xl text-white rounded-3xl border border-[#D4B28C]/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] transform hover:-translate-y-1 transition-all duration-300">
                
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4B28C]/20 border border-[#D4B28C]/40 text-[#D4B28C] font-label-caps text-[10px] uppercase tracking-widest font-black">
                    <Coffee className="w-3.5 h-3.5 text-[#D4B28C]" />
                    <span>MENU HIGHLIGHT</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00A8CC]/20 text-[#00A8CC] font-mono text-[10px] font-bold border border-[#00A8CC]/30">
                    10% Member Perk
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-headline-lg text-xl sm:text-2xl font-black text-white italic tracking-tight mb-1.5">
                  The Focus Blend Espresso
                </h3>

                {/* Description */}
                <p className="font-body text-xs sm:text-sm text-white/80 font-medium leading-relaxed">
                  A medium roast artisanal espresso with notes of dark Belgian chocolate &amp; toasted hazelnut — specially crafted for sustained cognitive clarity during long study sessions.
                </p>

                {/* Footer Details */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white/70 text-[11px]">Desk Delivery Ready</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-[#D4B28C] text-sm sm:text-base">₹90</span>
                    <span className="line-through text-white/40 text-[10px]">₹100</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

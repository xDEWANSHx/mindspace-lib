"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Sparkles,
  Compass,
  Layers,
  Camera,
  PenTool,
  Star,
  Coffee,
  Tag,
  ChevronRight
} from "lucide-react";

/* 6 Core Main Sections for smooth inline capsule navigation */
const NAV_SECTIONS = [
  { id: "bento-structural-grid", label: "Architecture", icon: Layers, isDarkSec: false },
  { id: "sanctuary-gallery", label: "Gallery", icon: Camera, isDarkSec: false },
  { id: "founder-note", label: "Founder", icon: PenTool, isDarkSec: true },
  { id: "google-reviews-section", label: "Reviews", icon: Star, isDarkSec: false },
  { id: "noiric-cafe-section", label: "Noiric Café", icon: Coffee, isDarkSec: true },
  { id: "membership-plans", label: "Pricing", icon: Tag, isDarkSec: false },
];

/* Important CTAs for Hero capsule mode */
const HERO_IMPORTANT_CTAS = [
  { id: "bento-structural-grid", label: "Architecture" },
  { id: "noiric-cafe-section", label: "Noiric Café" },
  { id: "membership-plans", label: "Membership" },
  { id: "google-reviews-section", label: "Reviews" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(NAV_SECTIONS[0]);
  const [showBrandText, setShowBrandText] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const scrollTimerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const isTop = window.scrollY < 100;
      setScrolled(!isTop);

      setShowBrandText(true);
      clearTimeout(scrollTimerRef.current);

      if (!isTop) {
        scrollTimerRef.current = setTimeout(() => {
          setShowBrandText(false);
        }, 3000);
      }

      const scrollPos = window.scrollY + 260;
      for (let i = NAV_SECTIONS.length - 1; i >= 0; i--) {
        const sec = NAV_SECTIONS[i];
        const el = document.getElementById(sec.id);
        if (el && scrollPos >= el.offsetTop) {
          setActiveSection(sec);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimerRef.current);
    };
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const ActiveIcon = activeSection.icon;
  const isSectionDark = activeSection.isDarkSec;

  return (
    <>
      {/* ── 1. Top-Left Executive Brand Logo (Always visible, 3s auto-slide behind logo) ── */}
      <div className="fixed top-4 left-4 sm:top-5 sm:left-8 z-50 pointer-events-auto">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="group flex items-center gap-3 bg-white/95 backdrop-blur-2xl p-2 pr-4 rounded-full border border-[#D4B28C]/50 shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-xl transition-all duration-500 hover:border-[#00A8CC]/60 cursor-pointer overflow-hidden"
        >
          {/* Logo Circle */}
          <div className="relative w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#00A8CC] via-[#D4B28C] to-[#00A8CC] shadow-sm shrink-0 z-10">
            <div className="w-full h-full rounded-full overflow-hidden bg-white relative flex items-center justify-center">
              <Image
                src="/assets/logo.jpg"
                alt="MindSpace Logo"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            {/* Live Green Dot */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-white rounded-full flex items-center justify-center">
              <span className="w-1 h-1 bg-white rounded-full animate-ping" />
            </span>
          </div>

          {/* Brand Name Text: Slides smoothly behind logo after 3 seconds */}
          <div
            className="flex flex-col transition-all duration-700 ease-in-out whitespace-nowrap overflow-hidden"
            style={{
              maxWidth: !scrolled || showBrandText ? "190px" : "0px",
              opacity: !scrolled || showBrandText ? 1 : 0,
              transform: !scrolled || showBrandText ? "translateX(0)" : "translateX(-16px)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-headline-lg text-base tracking-tight text-[#1C2421] font-black group-hover:text-[#00A8CC] transition-colors">
                MIND<span className="text-[#00A8CC]">SPACE</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#00A8CC]/10 text-[#00A8CC] font-label-caps text-[8px] uppercase font-black border border-[#00A8CC]/30">
                ABKP
              </span>
            </div>
            <span className="font-label-caps text-[8px] text-[#767872] uppercase tracking-widest font-extrabold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-[#D4B28C]" />
              STUDY SANCTUARY
            </span>
          </div>
        </button>
      </div>

      {/* ── 2. Top-Right Fixed Header: Become a Member CTA ── */}
      <div className="fixed top-4 right-4 sm:top-5 sm:right-8 z-50 pointer-events-auto">
        <button
          onClick={() => scrollToSection("lead-capture-crm-payload")}
          className="bg-[#00A8CC] hover:bg-[#0284c7] text-white font-label-caps text-[10px] sm:text-xs px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-lg font-black uppercase tracking-wider transition-all duration-300 hover:scale-105 cursor-pointer cyan-glow"
        >
          Become a Member
        </button>
      </div>

      {/* ── 3. Single Persistent Morphing Dynamic Island / Capsule Navbar ───────────────── */}
      {/* Positioned at bottom-6 on mobile (thumb zone) & top-5 on desktop to eliminate all overlap! */}
      <header className="fixed bottom-6 md:top-5 md:bottom-auto left-0 right-0 z-40 flex justify-center pointer-events-none px-4">
        
        <nav
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`pointer-events-auto backdrop-blur-2xl rounded-full flex items-center justify-center transition-all duration-500 ease-in-out overflow-hidden ${
            !scrolled
              ? "bg-white/95 border-2 border-[#D4B28C]/50 px-6 py-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.08)] max-w-xl text-[#1C2421]"
              : isHovered
                ? isSectionDark
                  ? "bg-[#FDFBF7]/95 border border-[#D4B28C]/60 px-5 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] max-w-[92vw] sm:max-w-[760px] text-[#1C2421]"
                  : "bg-[#1C2421]/95 border border-white/20 px-5 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] max-w-[92vw] sm:max-w-[760px] text-white"
                : isSectionDark
                  ? "bg-[#FDFBF7]/95 border-2 border-[#D4B28C]/60 px-4 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.3)] max-w-[260px] hover:scale-105 hover:border-[#00A8CC] text-[#1C2421]"
                  : "bg-[#1C2421]/92 border border-white/15 px-4 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.3)] max-w-[260px] hover:scale-105 hover:border-[#00A8CC]/60 text-white"
          }`}
        >

          {/* ── State A: Top Hero Mode (Full CTAs) ──────────────── */}
          {!scrolled && (
            <div className="flex items-center gap-4 sm:gap-8 transition-all duration-500 ease-in-out max-w-full overflow-x-auto no-scrollbar py-0.5">
              <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                {HERO_IMPORTANT_CTAS.map((cta) => (
                  <button
                    key={cta.id}
                    onClick={() => scrollToSection(cta.id)}
                    className="font-label-caps text-xs text-[#454742] hover:text-[#00A8CC] transition-colors duration-300 cursor-pointer font-bold uppercase tracking-wider"
                  >
                    {cta.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── State B: Scrolled Compact Mode (Active Icon + Section Name) ──────────────── */}
          {scrolled && !isHovered && (
            <div className="flex items-center gap-2.5 cursor-pointer transition-all duration-500 ease-in-out">
              <div className="w-7 h-7 rounded-full bg-[#00A8CC] flex items-center justify-center shrink-0 shadow-sm">
                <ActiveIcon className="w-3.5 h-3.5 text-white" />
              </div>

              <div
                key={activeSection.id}
                className={`flex items-center gap-1.5 transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-2 ${
                  isSectionDark ? "text-[#1C2421]" : "text-white"
                }`}
              >
                <span className="font-label-caps text-xs font-bold uppercase tracking-wider">
                  {activeSection.label}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${isSectionDark ? "text-[#1C2421]/40" : "text-white/40"}`} />
              </div>

              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse ml-0.5" />
            </div>
          )}

          {/* ── State C: Hovered Stretched Mode (Shows All Main Core CTAs Inline) ──────────────── */}
          {scrolled && isHovered && (
            <div className="flex items-center gap-2 sm:gap-3 transition-all duration-500 ease-in-out">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="w-7 h-7 rounded-full bg-[#00A8CC] flex items-center justify-center shrink-0 hover:scale-110 transition-transform duration-300 cursor-pointer"
                title="Scroll to Top"
              >
                <Compass className="w-3.5 h-3.5 text-white" />
              </button>

              <div className="flex items-center gap-1 sm:gap-2 max-w-[80vw] overflow-x-auto no-scrollbar py-1">
                {NAV_SECTIONS.map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeSection.id === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => {
                        scrollToSection(sec.id);
                        setIsHovered(false);
                      }}
                      className={`font-label-caps text-[10px] sm:text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 transition-all duration-300 cursor-pointer font-bold ${
                        isActive
                          ? "bg-[#00A8CC] text-white shadow-sm font-black"
                          : isSectionDark
                            ? "text-[#1C2421]/70 hover:text-[#1C2421] hover:bg-[#1C2421]/10"
                            : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{sec.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </nav>

      </header>
    </>
  );
}

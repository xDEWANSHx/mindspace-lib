"use client";

import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

const ROTATING_WORDS = ["Scholars.", "Aspirants.", "Dreamers.", "Achievers."];

export default function HeroSection() {
  const [wordIdx, setWordIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setWordIdx((i) => (i + 1) % ROTATING_WORDS.length);
        setVisible(true);
      }, 350);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero-section" className="relative w-full min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/library_hero_real.png"
          alt="MindSpace Study Sanctuary — Ambikapur"
          fill
          priority
          className="object-cover scale-105"
          style={{ animation: "subtleKenBurns 20s ease-in-out infinite alternate" }}
        />
        {/* Multi-layer overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FDFBF7] via-[#FDFBF7]/85 to-[#FDFBF7]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7]/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 md:px-16 w-full pt-32 pb-20">
        <div className="max-w-3xl space-y-7 text-left">


          {/* Headline */}
          <h1
            className="font-headline-lg text-4xl sm:text-6xl md:text-7xl lg:text-[82px] text-[#1C2421] leading-[1.0]"
            style={{ animation: "fadeSlideUp 0.7s ease-out 0.2s both", letterSpacing: "-0.03em" }}
          >
            The Library
            <br />
            Built for{" "}
            <span
              className="text-[#00A8CC] inline-block transition-all duration-300"
              style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)" }}
            >
              {ROTATING_WORDS[wordIdx]}
            </span>
          </h1>

          {/* Divider line */}
          <div
            className="w-20 h-0.5 bg-[#D4B28C]"
            style={{ animation: "fadeSlideUp 0.7s ease-out 0.35s both" }}
          />

          {/* Subtitle */}
          <p
            className="font-body text-sm sm:text-base md:text-lg text-[#454742] max-w-xl leading-relaxed"
            style={{ animation: "fadeSlideUp 0.7s ease-out 0.4s both" }}
          >
            Ambikapur&apos;s first premium study sanctuary — silent cabins, 1 Gbps fiber, artisanal coffee, and an environment calibrated for your deepest focus.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-wrap items-center gap-5 pt-2"
            style={{ animation: "fadeSlideUp 0.7s ease-out 0.5s both" }}
          >
            <button
              onClick={() => scrollToSection("lead-capture-crm-payload")}
              className="group relative px-8 sm:px-10 py-4 sm:py-5 bg-[#1C2421] text-[#FDFBF7] rounded-full font-label-caps text-xs sm:text-sm tracking-widest overflow-hidden transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(0,168,204,0.25)] cursor-pointer"
            >
              <span className="absolute inset-0 bg-[#00A8CC] translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 font-bold">Experience Silence</span>
            </button>

            <button
              onClick={() => scrollToSection("bento-structural-grid")}
              className="flex items-center gap-2 font-label-caps text-xs sm:text-sm text-[#1C2421] hover:text-[#00A8CC] transition-colors group cursor-pointer font-bold"
            >
              <span>Take a virtual tour</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
            </button>
          </div>

          {/* Trust signal strip */}
          <div
            className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#c6c7c0]/40"
            style={{ animation: "fadeSlideUp 0.7s ease-out 0.65s both" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[#00A8CC] font-headline-md text-xl font-black">4.9</span>
              <div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 fill-[#00A8CC]" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                  ))}
                </div>
                <p className="font-label-caps text-[9px] text-[#767872] uppercase tracking-widest">Google Rating</p>
              </div>
            </div>
            <div className="w-px h-8 bg-[#c6c7c0]/50" />
            <div>
              <span className="font-headline-md text-xl font-black text-[#1C2421]">120+</span>
              <p className="font-label-caps text-[9px] text-[#767872] uppercase tracking-widest">Cabins</p>
            </div>
            <div className="w-px h-8 bg-[#c6c7c0]/50" />
            <div>
              <span className="font-headline-md text-xl font-black text-[#1C2421]">15 hrs</span>
              <p className="font-label-caps text-[9px] text-[#767872] uppercase tracking-widest">Daily Access</p>
            </div>
          </div>

        </div>
      </div>

      {/* Ken Burns keyframe */}
      <style>{`
        @keyframes subtleKenBurns {
          from { transform: scale(1.0) translateX(0px); }
          to   { transform: scale(1.06) translateX(-10px); }
        }
      `}</style>
    </section>
  );
}

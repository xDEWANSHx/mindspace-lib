"use client";

import { useEffect, useRef, useState } from "react";

/*
  DominoWord: Renders letters straight initially.
  When `active` turns true, each letter transitions to italic + skewX(-14deg)
  with a staggered transition-delay, creating a true domino cascade effect!
*/
function DominoWord({ word, color, active, startDelay = 0, skewDeg = -14 }) {
  const letters = word.split("");
  return (
    <span className="inline-flex items-baseline overflow-visible py-1">
      {letters.map((ch, i) => {
        const delay = startDelay + i * 65; // 65ms domino stagger
        return (
          <span
            key={i}
            className="inline-block transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom"
            style={{
              color,
              fontStyle: active ? "italic" : "normal",
              transform: active ? `skewX(${skewDeg}deg)` : "skewX(0deg)",
              transitionDelay: `${delay}ms`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}

export default function MantraSection() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [dominoActive, setDominoActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          // Small delay after section comes into view, then trigger the domino cascade!
          const timer = setTimeout(() => {
            setDominoActive(true);
          }, 300);
          observer.disconnect();
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.35 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="w-full bg-[#1C2421] py-28 sm:py-36 overflow-hidden relative">
      {/* Crosshatch grain */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg, #FDFBF7 0, #FDFBF7 1px, transparent 0, transparent 50%)",
          backgroundSize: "10px 10px",
        }}
      />

      {/* Ghost watermark */}
      <span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display-xl text-white/[0.035] pointer-events-none select-none tracking-tighter leading-none font-black"
        style={{ fontSize: "clamp(100px, 20vw, 260px)" }}
        aria-hidden
      >
        POSSIBILITY
      </span>

      <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">

          {/* Eyebrow */}
          <div
            className="flex items-center justify-center gap-4 transition-all duration-700"
            style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(16px)" }}
          >
            <div className="w-12 h-px bg-[#00A8CC]" />
            <span className="font-label-caps text-[#00A8CC] text-[10px] sm:text-xs uppercase tracking-[0.4em] font-bold">
              Our Core Philosophy
            </span>
            <div className="w-12 h-px bg-[#00A8CC]" />
          </div>

          {/* Mantra with domino italic cascade */}
          <div
            className="transition-all duration-1000 delay-100"
            style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(28px)" }}
          >
            <h2
              className="font-headline-lg text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-[#FDFBF7] leading-[1.15]"
              style={{ letterSpacing: "-0.025em" }}
            >
              &ldquo;BOOKS OPEN{" "}
              <DominoWord
                word="MIND"
                color="#D4B28C"
                active={dominoActive}
                startDelay={100}
                skewDeg={-14}
              />
              ,<br />
              MINDSPACE OPEN{" "}
              <DominoWord
                word="POSSIBILITIES"
                color="#00A8CC"
                active={dominoActive}
                startDelay={500}
                skewDeg={-12}
              />
              .&rdquo;
            </h2>
          </div>

          {/* Attribution */}
          <p
            className="font-label-caps text-[10px] sm:text-xs text-white/30 uppercase tracking-[0.3em] transition-all duration-700 delay-300"
            style={{ opacity: inView ? 1 : 0 }}
          >
            — Harsh Goyal, Founder &amp; Managing Director
          </p>

        </div>
      </div>
    </section>
  );
}

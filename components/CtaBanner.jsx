"use client";

import { ArrowRight } from "lucide-react";

/*
  SpiralBinding — renders a realistic notebook coil/ring binding as SVG.
  Each ring is:
    1. The back arc (below the spine) — darker, thinner
    2. The spine bar itself
    3. The front arch (above the spine) — the prominent, metallic D-shape
  
  This gives the real 3D notebook-ring illusion.
*/
function SpiralBinding({ flipped = false }) {
  const ringCount = 34;
  const pitch = 26;          // center-to-center spacing
  const archH = 14;          // height of arch above spine
  const tailH = 7;           // tail below spine (shorter = more realistic)
  const tubeW = 5;           // stroke width of the ring tube
  const svgH = archH + tailH + 10;
  const totalW = ringCount * pitch + pitch * 0.5;
  const spineY = archH + 5; // Y position of spine centerline

  return (
    <div
      aria-hidden
      style={{
        background: "#141A17",
        transform: flipped ? "scaleY(-1)" : "none",
        lineHeight: 0,
      }}
    >
      <svg
        width="100%"
        height={svgH}
        viewBox={`0 0 ${totalW} ${svgH}`}
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Dark metallic gradient for ring tube */}
          <linearGradient id="ringMetal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#1a1a1a"/>
            <stop offset="35%"  stopColor="#3d3d3d"/>
            <stop offset="50%"  stopColor="#111"/>
            <stop offset="65%"  stopColor="#3d3d3d"/>
            <stop offset="100%" stopColor="#1a1a1a"/>
          </linearGradient>
          {/* Highlight sheen on top of each arch */}
          <linearGradient id="archSheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#555" stopOpacity="0.9"/>
            <stop offset="60%"  stopColor="#222" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#111" stopOpacity="0"/>
          </linearGradient>
          {/* Spine gradient */}
          <linearGradient id="spineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2c2c2c"/>
            <stop offset="40%"  stopColor="#0d0d0d"/>
            <stop offset="100%" stopColor="#1a1a1a"/>
          </linearGradient>
        </defs>

        {/* ── Step 1: draw back-arc tails (below spine, darker, visible between rings) */}
        {Array.from({ length: ringCount }).map((_, i) => {
          const cx = i * pitch + pitch * 0.75;
          const rw = pitch * 0.32;
          // Back arc: semi-ellipse below the spine
          return (
            <path
              key={`tail-${i}`}
              d={`M ${cx - rw},${spineY} A ${rw},${tailH} 0 0 0 ${cx + rw},${spineY}`}
              fill="none"
              stroke="#1e1e1e"
              strokeWidth={tubeW - 1}
              strokeLinecap="round"
            />
          );
        })}

        {/* ── Step 2: Spine bar (covers where ring meets spine) */}
        <rect
          x={0}
          y={spineY - 4}
          width={totalW}
          height={8}
          fill="url(#spineGrad)"
          rx={2}
        />
        {/* Spine top highlight line */}
        <line
          x1={0} y1={spineY - 4}
          x2={totalW} y2={spineY - 4}
          stroke="#333"
          strokeWidth={1}
          opacity={0.8}
        />
        {/* Spine bottom shadow line */}
        <line
          x1={0} y1={spineY + 4}
          x2={totalW} y2={spineY + 4}
          stroke="#080808"
          strokeWidth={1}
          opacity={0.9}
        />

        {/* ── Step 3: Front arch of each ring (above the spine) */}
        {Array.from({ length: ringCount }).map((_, i) => {
          const cx = i * pitch + pitch * 0.75;
          const rw = pitch * 0.32;
          // Front arch: semi-ellipse above the spine
          const archPath = `M ${cx - rw},${spineY} A ${rw},${archH} 0 0 1 ${cx + rw},${spineY}`;

          return (
            <g key={`arch-${i}`}>
              {/* Outer shadow stroke */}
              <path
                d={archPath}
                fill="none"
                stroke="#050505"
                strokeWidth={tubeW + 2.5}
                strokeLinecap="round"
              />
              {/* Main ring body — dark metallic */}
              <path
                d={archPath}
                fill="none"
                stroke="#222"
                strokeWidth={tubeW}
                strokeLinecap="round"
              />
              {/* Mid sheen stroke */}
              <path
                d={archPath}
                fill="none"
                stroke="#3c3c3c"
                strokeWidth={tubeW * 0.5}
                strokeLinecap="round"
              />
              {/* Tiny highlight at top of arch */}
              <path
                d={`M ${cx - rw * 0.6},${spineY - archH * 0.6} A ${rw * 0.6},${archH * 0.5} 0 0 1 ${cx + rw * 0.6},${spineY - archH * 0.6}`}
                fill="none"
                stroke="#4a4a4a"
                strokeWidth={1}
                strokeLinecap="round"
                opacity={0.6}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function CtaBanner() {
  const scrollToForm = () => {
    const el = document.getElementById("lead-capture-crm-payload");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full relative z-20">
      {/* Top spiral ring binding */}
      <SpiralBinding />

      {/* Main CTA */}
      <section className="w-full bg-[#141A17] py-14 sm:py-20 px-6 sm:px-12 md:px-16 overflow-hidden relative">
        <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-[#00A8CC]/6 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[200px] bg-[#D4B28C]/6 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
            <div className="max-w-2xl">
              <span className="font-label-caps text-[#00A8CC] text-xs uppercase tracking-widest font-bold block mb-4">
                Limited Seats Available
              </span>
              <h2
                className="font-headline-lg text-4xl sm:text-5xl md:text-6xl text-white leading-[1.05]"
                style={{ letterSpacing: "-0.025em" }}
              >
                Your Focus.<br />
                <span className="text-[#D4B28C]">Your Cabin.</span><br />
                Your Sanctuary.
              </h2>
            </div>
            <div className="shrink-0 flex flex-col items-start gap-4">
              <button
                onClick={scrollToForm}
                className="group flex items-center gap-3 px-8 sm:px-10 py-5 bg-[#D4B28C] text-[#1C2421] rounded-full font-label-caps text-xs sm:text-sm hover:bg-white transition-all shadow-xl font-bold cursor-pointer uppercase tracking-widest"
              >
                <span>Claim Your Cabin</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
              </button>
              <p className="font-body text-xs text-white/30 max-w-xs leading-relaxed">
                Space is deliberately limited to preserve silence. Intake opens every month.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom spiral ring binding (flipped) */}
      <SpiralBinding flipped />
    </div>
  );
}

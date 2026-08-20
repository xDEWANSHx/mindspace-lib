"use client";

import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Sanctuary", id: "bento-structural-grid" },
  { label: "Membership", id: "membership-plans" },
  { label: "Founder", id: "founder-note" },
  { label: "FAQ", id: "faq-section" },
  { label: "Join", id: "lead-capture-crm-payload" },
];

export default function Footer() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-[#141A17] text-[#FDFBF7] relative overflow-hidden">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(#FDFBF7 1px, transparent 1px), linear-gradient(to right, #FDFBF7 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 md:px-16">

        {/* Top: brand + nav */}
        <div className="py-16 border-b border-white/10 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white wood-stroke shrink-0">
                <Image src="/assets/logo.jpg" alt="MindSpace Logo" fill className="object-cover" />
              </div>
              <div>
                <span className="font-headline-md text-xl text-white font-black tracking-tight">
                  MIND<span className="text-[#00A8CC]">SPACE</span>
                </span>
                <p className="font-label-caps text-[9px] text-[#767872] uppercase tracking-[0.2em]">Study Sanctuary · Ambikapur</p>
              </div>
            </div>
            <p className="font-body text-sm text-white/50 leading-relaxed max-w-xs">
              Ambikapur&apos;s first premium study library — engineered for deep work, built for ambition.
            </p>
            <p className="font-label-caps text-[9px] text-[#D4B28C] uppercase tracking-widest italic">
              &quot;Books open mind, MindSpace opens possibilities.&quot;
            </p>
          </div>

          {/* Nav links */}
          <div className="flex flex-col sm:flex-row gap-10 sm:justify-end">
            <div className="space-y-3">
              <p className="font-label-caps text-[10px] text-[#00A8CC] uppercase tracking-widest font-bold mb-4">Navigate</p>
              {NAV_LINKS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => scrollTo(l.id)}
                  className="block font-body text-sm text-white/60 hover:text-white transition-colors cursor-pointer text-left"
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <p className="font-label-caps text-[10px] text-[#00A8CC] uppercase tracking-widest font-bold mb-4">Location</p>
              <p className="font-body text-sm text-white/60 leading-relaxed">
                MG Road, Near Goyal Super Mart,<br />
                Patpariya, Ambikapur,<br />
                Chhattisgarh — 497001
              </p>
              <p className="font-label-caps text-[10px] text-[#767872] uppercase tracking-widest">
                22.1245° N, 83.1936° E
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="font-body text-xs text-white/30">
            © {new Date().getFullYear()} MindSpace Library. Founder: Harsh Goyal. All rights reserved.
          </p>
          
          <div className="font-body text-xs text-white/50 flex items-center justify-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <span>Developed by</span>
            <span className="font-bold text-[#00A8CC] tracking-wide">Synchad Tech</span>
          </div>

          <Link
            href="/login"
            className="font-label-caps text-[9px] text-white/25 hover:text-[#00A8CC] uppercase tracking-widest transition-colors"
          >
            Staff & Admin Portal
          </Link>
        </div>

      </div>
    </footer>
  );
}

"use client";

import Image from "next/image";
import { Armchair, Wifi, BookOpen, VolumeX, Sparkles } from "lucide-react";

export default function BentoMatrix() {
  return (
    <section id="bento-structural-grid" className="w-full bg-[#FDFBF7] py-20 md:py-28 relative overflow-hidden">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.2]"
        style={{
          backgroundImage: "radial-gradient(circle, #c6c7c0 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col gap-3 text-left max-w-2xl mb-12 sm:mb-16">
          <div className="flex items-center gap-3">
            <span className="w-10 h-[2px] bg-[#D4B28C]" />
            <span className="font-label-caps text-xs text-[#D4B28C] uppercase tracking-widest font-bold">
              Sanctuary Architecture
            </span>
          </div>
          <h2 className="font-headline-lg text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#1C2421] leading-tight">
            DESIGNED FOR <span className="text-[#00A8CC]">DEEP WORK</span>
          </h2>
          <p className="font-body text-sm sm:text-base text-[#454742]">
            Eliminating the cognitive load of noise, so your brain can achieve the &apos;Flow&apos; state faster.
          </p>
        </div>

        {/* 12-Column Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Card 1: Main Focus Hall (8 Columns Desktop) */}
          <div className="md:col-span-8 h-[380px] sm:h-[480px] rounded-[32px] sm:rounded-[48px] overflow-hidden relative wood-stroke shadow-lg group">
            <Image
              src="/assets/library_interior.png"
              alt="Main Focus Hall"
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C2421]/90 via-[#1C2421]/30 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 sm:bottom-12 sm:left-12 sm:right-12">
              <span className="font-label-caps text-[10px] sm:text-xs text-[#00A8CC] uppercase font-bold tracking-widest block mb-1">
                Acoustic Sanctuary
              </span>
              <h3 className="font-headline-md text-2xl sm:text-3xl text-white mb-2">
                Designed for Deep Work
              </h3>
              <p className="font-body text-xs sm:text-sm text-white/80 max-w-md leading-relaxed">
                Eliminating the cognitive load of noise, so your brain can achieve the &apos;Flow&apos; state faster. Every desk is calibrated for zero distraction.
              </p>
            </div>
          </div>

          {/* Card 2 & 3 Right Column (4 Columns Desktop) */}
          <div className="md:col-span-4 flex flex-col gap-6">
            
            {/* Card 2: 100+ Cabins */}
            <div className="flex-1 min-h-[220px] bg-[#e7f0eb] rounded-[32px] sm:rounded-[40px] p-8 flex flex-col justify-between wood-stroke group hover:bg-[#fed9b1] transition-all duration-500 relative overflow-hidden">
              {/* Background large decorative SVG */}
              <Armchair className="absolute -bottom-6 -right-6 w-44 h-44 text-[#745a3a]/15 group-hover:text-[#745a3a]/25 group-hover:scale-110 transition-all duration-500 pointer-events-none" />

              <div className="flex justify-between items-start relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-[#745a3a]/10 flex items-center justify-center">
                  <Armchair className="w-6 h-6 text-[#745a3a]" />
                </div>
                <span className="font-label-caps text-[#745a3a] text-[10px] uppercase tracking-widest font-bold">
                  Infrastructure
                </span>
              </div>

              <div className="relative z-10">
                <div className="font-headline-lg text-[#5a4224] text-4xl sm:text-5xl leading-none">
                  100+
                </div>
                <p className="font-label-caps text-[#795e3e] text-xs uppercase font-bold mt-2">
                  Ergonomic Cabins
                </p>
              </div>
            </div>

            {/* Card 3: 1 Gbps Fiber */}
            <div className="flex-1 min-h-[220px] bg-[#00A8CC] rounded-[32px] sm:rounded-[40px] p-8 flex flex-col justify-between wood-stroke group hover:bg-[#1C2421] transition-all duration-500 cyan-glow relative overflow-hidden">
              {/* Background large decorative SVG */}
              <Wifi className="absolute -bottom-8 -right-8 w-48 h-48 text-white/15 group-hover:text-white/25 group-hover:scale-110 transition-all duration-500 pointer-events-none" />

              <div className="flex justify-between items-start relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Wifi className="w-6 h-6 text-white" />
                </div>
                <span className="font-label-caps text-white/90 text-[10px] uppercase tracking-widest font-bold">
                  Connectivity
                </span>
              </div>

              <div className="relative z-10">
                <div className="font-headline-lg text-white text-4xl sm:text-5xl leading-none">
                  1 Gbps
                </div>
                <p className="font-label-caps text-white/90 text-xs uppercase font-bold mt-2">
                  Dedicated Fiber Optic
                </p>
              </div>
            </div>

          </div>

          {/* Card 4: 5000+ Books (4 Columns Desktop) */}
          <div className="md:col-span-4 min-h-[260px] bg-[#745a3a] rounded-[32px] sm:rounded-[40px] p-8 flex flex-col justify-between wood-stroke group hover:brightness-110 transition-all text-white relative overflow-hidden">
            {/* Background large decorative SVG */}
            <BookOpen className="absolute -bottom-8 -right-8 w-48 h-48 text-white/15 group-hover:text-white/25 group-hover:scale-110 transition-all duration-500 pointer-events-none" />

            <div className="flex justify-between items-start relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="font-label-caps text-white/80 text-[10px] uppercase tracking-widest font-bold">
                Resources
              </span>
            </div>

            <div className="relative z-10">
              <div className="font-headline-lg text-white text-4xl sm:text-5xl leading-none">
                5,000+
              </div>
              <p className="font-label-caps text-white/80 text-xs uppercase font-bold mt-2">
                Reference Stacks & Magazines
              </p>
            </div>
          </div>

          {/* Card 5: The Silent Reading Sanctuary (8 Columns Desktop) */}
          <div className="md:col-span-8 min-h-[260px] bg-[#454742] rounded-[32px] sm:rounded-[40px] p-8 sm:p-10 flex items-center gap-6 sm:gap-10 wood-stroke text-white group relative overflow-hidden">
            {/* Background large decorative SVG */}
            <VolumeX className="absolute -bottom-10 -right-6 w-56 h-56 text-white/10 group-hover:text-[#00A8CC]/20 group-hover:scale-110 transition-all duration-500 pointer-events-none" />

            <div className="hidden lg:flex w-24 h-24 rounded-full border border-white/20 shrink-0 items-center justify-center p-4 relative z-10">
              <VolumeX className="w-10 h-10 text-[#00A8CC] animate-pulse" />
            </div>
            <div className="space-y-3 relative z-10">
              <span className="font-label-caps text-[#00A8CC] text-[10px] uppercase font-bold tracking-widest">
                Our Distinctive Identity
              </span>
              <h3 className="font-headline-md text-2xl sm:text-3xl text-white">
                The Silent Reading Sanctuary
              </h3>
              <p className="font-body text-xs sm:text-sm text-white/70 max-w-xl leading-relaxed">
                Unlike traditional lending libraries, MindSpace is a dedicated environment for concentration. No checkout counters, no chatter. Just pure, unadulterated focus.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

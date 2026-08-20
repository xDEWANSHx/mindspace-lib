"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Quote, Sparkles, Award, CheckCircle } from "lucide-react";
import { fetchSystemSettingsCloud, DEFAULT_SYSTEM_SETTINGS } from "@/lib/adminService";

export default function FounderNote() {
  const [settings, setSettings] = useState(DEFAULT_SYSTEM_SETTINGS);

  useEffect(() => {
    async function loadFounderData() {
      const data = await fetchSystemSettingsCloud();
      if (data) {
        setSettings({
          ...DEFAULT_SYSTEM_SETTINGS,
          ...data
        });
      }
    }
    loadFounderData();
  }, []);

  const founderPhoto = settings.founderPhoto || DEFAULT_SYSTEM_SETTINGS.founderPhoto;
  const founderName = settings.founderName || DEFAULT_SYSTEM_SETTINGS.founderName;
  const founderRole = settings.founderRole || DEFAULT_SYSTEM_SETTINGS.founderRole;
  const founderSubrole = settings.founderSubrole || DEFAULT_SYSTEM_SETTINGS.founderSubrole;
  const founderNoteP1 = settings.founderNoteP1 || settings.founderNote || DEFAULT_SYSTEM_SETTINGS.founderNoteP1;
  const founderNoteP2 = settings.founderNoteP2 || DEFAULT_SYSTEM_SETTINGS.founderNoteP2;
  const founderTagline = settings.founderTagline || DEFAULT_SYSTEM_SETTINGS.founderTagline;

  const isExternalPhoto = founderPhoto && (founderPhoto.startsWith("http") || founderPhoto.startsWith("data:"));

  return (
    <section id="founder-note" className="w-full bg-[#1C2421] text-white py-24 sm:py-32 relative overflow-hidden border-y border-white/10">

      {/* Background Graphic Watermarks & Glows */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#00A8CC]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#D4B28C]/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Watermarks */}
      <span className="absolute -bottom-10 right-10 font-display-xl text-[160px] sm:text-[240px] text-white/5 pointer-events-none select-none tracking-tighter leading-none font-black">
        {founderName ? founderName.split(" ").slice(-1)[0]?.toUpperCase() : "GOYAL"}
      </span>

      <span
        className="absolute top-2 left-2 sm:-top-6 sm:-left-4 font-black tracking-tighter leading-none text-white/[0.08] pointer-events-none select-none z-0"
        style={{
          fontSize: "clamp(110px, 22vw, 240px)",
          fontFamily: "var(--font-anybody, sans-serif)",
          letterSpacing: "-0.04em",
        }}
      >
        {founderName ? founderName.split(" ")[0]?.toUpperCase() : "HARSH"}
      </span>

      <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left Column: Founder Portrait Card (5 Columns Desktop) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[380px] group">

              {/* Outer Glowing Border Frame */}
              <div className="absolute -inset-1 bg-gradient-to-tr from-[#00A8CC] via-[#D4B28C] to-[#00A8CC] rounded-[44px] blur-md opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

              <div className="relative w-full aspect-[4/5] rounded-[40px] overflow-hidden wood-stroke bg-[#262F2C] shadow-2xl">
                {isExternalPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={founderPhoto}
                    alt={`${founderName} - ${founderRole}`}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                ) : (
                  <Image
                    src={founderPhoto}
                    alt={`${founderName} - ${founderRole}`}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                )}

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C2421] via-transparent to-transparent opacity-90" />

                {/* Floating Badge */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-[#1C2421]/90 backdrop-blur-md border border-white/10 shadow-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-headline-md text-lg text-white font-bold flex items-center gap-1.5">
                      <span>{founderName}</span>
                      <CheckCircle className="w-4 h-4 text-[#00A8CC] fill-[#00A8CC]/20" />
                    </h3>
                    <p className="font-label-caps text-[10px] text-[#D4B28C] uppercase font-bold tracking-widest">
                      {founderRole}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-[#00A8CC]/20 border border-[#00A8CC]/40 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-[#00A8CC]" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Editorial Letter & Vision Statement */}
          <div className="lg:col-span-7 space-y-8 text-left">

            {/* Header Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#D4B28C]/15 border border-[#D4B28C]/30 text-[#D4B28C] font-label-caps text-xs uppercase tracking-widest font-bold">
              <Sparkles className="w-4 h-4 text-[#D4B28C]" />
              <span>Visionaries of Ambikapur</span>
            </div>

            {/* Headline */}
            <h2 className="font-headline-lg text-3xl sm:text-4xl lg:text-5xl text-white leading-tight">
              A LETTER FROM <br />
              <span className="text-[#00A8CC]">OUR FOUNDER</span>
            </h2>

            {/* Quote Box Container */}
            <div className="relative p-6 sm:p-8 rounded-3xl bg-[#262F2C]/80 border border-white/10 backdrop-blur-md space-y-6 shadow-xl hover:border-white/20 transition-colors duration-500">
              <Quote className="w-10 h-10 text-[#00A8CC]/40 rotate-180 mb-2" />

              <div className="font-quote-editorial text-white/90 space-y-4 leading-relaxed text-base sm:text-lg lg:text-xl font-light">
                {founderNoteP1 && <p>&quot;{founderNoteP1}&quot;</p>}
                {founderNoteP2 && <p>&quot;{founderNoteP2}&quot;</p>}
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-headline-md text-lg text-white font-bold">
                    {founderName}
                  </p>
                  <p className="font-label-caps text-xs text-[#00A8CC] uppercase font-bold tracking-wider">
                    {founderSubrole}
                  </p>
                </div>
                {founderTagline && (
                  <div className="font-quote-editorial italic text-xs text-white/50 border-l border-white/20 pl-4">
                    &quot;{founderTagline}&quot;
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

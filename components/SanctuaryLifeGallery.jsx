"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";

const GALLERY_ITEMS = [
  {
    title: "The Brew Lab",
    subtitle: "Noiric Cafe Lounge",
    image: "/assets/gallery_relax_lounge.png",
    span: "md:col-span-3 lg:col-span-3",
    height: "h-[320px] sm:h-[400px]",
  },
  {
    title: "Focus Cabin",
    subtitle: "Silent Individual Workstations",
    image: "/assets/gallery_quiet_study.png",
    span: "md:col-span-3 lg:col-span-2",
    height: "h-[190px] sm:h-[200px]",
  },
  {
    title: "The Archives",
    subtitle: "5000+ Reference Books",
    image: "/assets/gallery_book_stack.png",
    span: "md:col-span-3 lg:col-span-1",
    height: "h-[190px] sm:h-[200px]",
  },
  {
    title: "Tech Core",
    subtitle: "1 Gbps Fiber & Power Array",
    image: "/assets/library_interior.png",
    span: "md:col-span-3 lg:col-span-1",
    height: "h-[190px] sm:h-[200px]",
  },
  {
    title: "Workstation",
    subtitle: "Ergonomic Study Desks",
    image: "/assets/workstation_scroller.png",
    span: "md:col-span-3 lg:col-span-2",
    height: "h-[190px] sm:h-[200px]",
  },
  {
    title: "Premium Lounge",
    subtitle: "Velvet Seating & Curated Ambiance",
    image: "/assets/feature_lounge.png",
    span: "md:col-span-3 lg:col-span-3",
    height: "h-[260px] sm:h-[300px]",
  },
];

export default function SanctuaryLifeGallery() {
  const [lightbox, setLightbox] = useState(null); // { image, title, subtitle }

  const openLightbox = useCallback((item) => {
    setLightbox(item);
    document.body.style.overflow = "hidden";
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox(null);
    document.body.style.overflow = "";
  }, []);

  return (
    <section id="sanctuary-gallery" className="w-full py-20 sm:py-28 relative" style={{ background: "#FDFBF7" }}>
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(#1C2421 1px, transparent 1px), linear-gradient(to right, #1C2421 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 relative z-10">

        {/* Gallery Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 sm:mb-16 gap-6">
          <div className="max-w-xl text-left">
            <span className="font-label-caps text-xs text-[#00A8CC] uppercase font-bold tracking-widest block mb-2">
              Visual Journey
            </span>
            <h2 className="font-headline-lg text-3xl sm:text-4xl md:text-5xl text-[#1C2421]">
              Sanctuary Life
            </h2>
            <p className="font-body text-xs sm:text-sm text-[#454742] opacity-80 mt-2">
              A glimpse into the textures, flavors, and moments of focus that define the MindSpace experience. <span className="text-[#00A8CC] font-semibold">Click any image to explore.</span>
            </p>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById("bento-structural-grid");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="font-label-caps text-xs text-[#00A8CC] border-b border-[#00A8CC]/40 pb-1 hover:border-[#00A8CC] transition-all uppercase font-bold cursor-pointer"
          >
            Explore All Cabins
          </button>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 sm:gap-6">
          {GALLERY_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className={`${item.span} ${item.height} relative rounded-[28px] sm:rounded-[36px] overflow-hidden wood-stroke group cursor-pointer`}
              onClick={() => openLightbox(item)}
              style={{
                opacity: 0,
                animation: `fadeSlideUp 0.6s ease-out ${idx * 0.08 + 0.1}s forwards`,
              }}
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Dark hover overlay */}
              <div className="absolute inset-0 bg-[#1C2421]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center backdrop-blur-[2px] p-6 text-center">
                <ZoomIn className="w-8 h-8 text-white mb-3 opacity-80" />
                <span className="font-headline-md text-white text-xl sm:text-2xl block">{item.title}</span>
                <span className="font-label-caps text-xs text-[#00A8CC] font-bold uppercase tracking-widest mt-1 block">{item.subtitle}</span>
              </div>

              {/* Always-visible bottom label */}
              <div className="absolute bottom-0 left-0 right-0 px-5 py-3 bg-gradient-to-t from-[#1C2421]/80 to-transparent">
                <p className="font-headline-md text-white text-sm leading-tight">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Overlay */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-8"
          onClick={closeLightbox}
          style={{ animation: "fadeIn 0.2s ease-out" }}
        >
          {/* Blurred dimmed backdrop */}
          <div className="absolute inset-0 bg-[#1C2421]/80 backdrop-blur-xl" />

          {/* Image Card */}
          <div
            className="relative z-10 w-full max-w-4xl rounded-[32px] overflow-hidden wood-stroke shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "scaleIn 0.3s cubic-bezier(0.16,1,0.3,1)" }}
          >
            <div className="relative aspect-[16/9]">
              <Image src={lightbox.image} alt={lightbox.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C2421]/60 via-transparent to-transparent" />

              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#1C2421]/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-[#00A8CC] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Caption */}
              <div className="absolute bottom-6 left-6">
                <p className="font-headline-lg text-[#FDFBF7] text-2xl sm:text-3xl">{lightbox.title}</p>
                <p className="font-label-caps text-[#00A8CC] text-xs font-bold uppercase tracking-widest mt-1">{lightbox.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

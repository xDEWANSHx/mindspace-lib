"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function CinematicScroller() {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    // Register GSAP ScrollTrigger inside useEffect
    gsap.registerPlugin(ScrollTrigger);

    const container = containerRef.current;
    const image = imageRef.current;

    if (!container || !image) return;

    // Timeline configuration
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerRef.current,
        start: "top top",
        end: "+=2500", // Scroll length for the 3 frames
        pin: true,
        scrub: 1.2,
        snap: {
          snapTo: [0, 0.5, 1],
          duration: { min: 0.2, max: 0.6 },
          delay: 0.1,
          ease: "power2.inOut",
        },
        invalidateOnRefresh: true,
      },
    });

    // Frame 1 -> Frame 2: Zoom in and shift camera focus onto Cabin Desk surface
    tl.to(
      image,
      {
        scale: 1.85,
        xPercent: -8,
        yPercent: 18,
        ease: "power2.inOut",
      },
      0
    );

    // Frame 2: Reveal thin vector text lines pointing out custom features
    tl.fromTo(
      ".desk-pointer-callout",
      {
        opacity: 0,
        y: 30,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: 0.08,
        ease: "power3.out",
      },
      0.35
    );

    // Frame 2 -> Frame 3: Zoom deeper and pop lifestyle elements (laptop, notebook, pens)
    tl.to(
      image,
      {
        scale: 2.1,
        xPercent: -12,
        yPercent: 25,
        ease: "power2.inOut",
      },
      0.8
    );

    tl.fromTo(
      ".lifestyle-desk-object",
      {
        opacity: 0,
        scale: 0.8,
        y: 20,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        stagger: 0.06,
        ease: "back.out(1.8)",
      },
      1.0
    );

    // Frame 3: Fade in the massive overlay display CTA
    tl.fromTo(
      ".conversion-headline-overlay",
      {
        opacity: 0,
        scale: 0.9,
        y: 50,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        letterSpacing: "-0.04em",
        ease: "power4.out",
      },
      1.4
    );

    return () => {
      // Clean up all ScrollTrigger instances
      if (tl.scrollTrigger) {
        tl.scrollTrigger.kill();
      }
    };
  }, []);

  return (
    <div ref={triggerRef} className="relative w-full h-screen bg-[#FDFBF7]">
      {/* Container holding the viewport */}
      <div
        ref={containerRef}
        className="w-full h-full relative overflow-hidden flex items-center justify-center"
      >
        {/* Background Image Container */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            ref={imageRef}
            src="/assets/workstation_scroller.png"
            alt="Workstation Scenic Zoom"
            fill
            priority
            className="object-cover origin-center"
          />
          {/* Ambient vignette and overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-ink-primary/30 via-transparent to-ink-primary/75 pointer-events-none" />
        </div>

        {/* Frame 1 Overview overlay instructions (passive floating guide) */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-bg-warm-primary/80 border border-stone-200/50 backdrop-blur-md px-6 py-2 rounded-full pointer-events-none text-xs font-semibold uppercase tracking-widest text-ink-secondary flex items-center gap-2 shadow-sm z-30">
          <span>Scroll to explore the premium desk details</span>
          <span className="w-1.5 h-1.5 bg-accent-aqua-core rounded-full animate-ping" />
        </div>

        {/* Frame 2: Vector Callout Pointers (positioned relative to container center) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 relative h-full flex items-center justify-between">
            {/* Callout 1 (Top Left area of desk) */}
            <div className="desk-pointer-callout absolute top-[28%] left-[4%] sm:left-[12%] flex items-start gap-2 sm:gap-4">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white bg-accent-aqua-core flex items-center justify-center mt-1 shrink-0">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full" />
              </div>
              <div className="bg-bg-warm-elevated border border-stone-200/50 p-2.5 sm:p-4 squircle-sm shadow-md max-w-[150px] sm:max-w-[200px]">
                <h4 className="text-[10px] sm:text-xs font-bold text-ink-primary uppercase tracking-wider mb-0.5 sm:mb-1">
                  Lighting
                </h4>
                <p className="text-[9px] sm:text-[11px] text-ink-secondary leading-tight sm:leading-normal">
                  Dimmable anti-glare focus light bar built under locker.
                </p>
              </div>
            </div>

            {/* Callout 2 (Center Right area of desk) */}
            <div className="desk-pointer-callout absolute top-[45%] right-[4%] sm:right-[15%] flex items-start gap-2 sm:gap-4">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white bg-accent-aqua-core flex items-center justify-center mt-1 shrink-0">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full" />
              </div>
              <div className="bg-bg-warm-elevated border border-stone-200/50 p-2.5 sm:p-4 squircle-sm shadow-md max-w-[150px] sm:max-w-[200px]">
                <h4 className="text-[10px] sm:text-xs font-bold text-ink-primary uppercase tracking-wider mb-0.5 sm:mb-1">
                  Space Size
                </h4>
                <p className="text-[9px] sm:text-[11px] text-ink-secondary leading-tight sm:leading-normal">
                  Expanded workstation built for dual laptops & logs.
                </p>
              </div>
            </div>

            {/* Callout 3 (Bottom Left area of desk) */}
            <div className="desk-pointer-callout absolute bottom-[22%] sm:bottom-[28%] left-[4%] sm:left-[22%] flex items-start gap-2 sm:gap-4">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white bg-accent-aqua-core flex items-center justify-center mt-1 shrink-0">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full" />
              </div>
              <div className="bg-bg-warm-elevated border border-stone-200/50 p-2.5 sm:p-4 squircle-sm shadow-md max-w-[150px] sm:max-w-[200px]">
                <h4 className="text-[10px] sm:text-xs font-bold text-ink-primary uppercase tracking-wider mb-0.5 sm:mb-1">
                  Instant Service
                </h4>
                <p className="text-[9px] sm:text-[11px] text-ink-secondary leading-tight sm:leading-normal">
                  Native QR code ordering coordinates with Noiric Cafe.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Frame 3: Lifestyle Desk Objects (Mockup overlays fading in on top of desk) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 relative h-full flex items-center justify-center">
            {/* Overlay objects inside the viewport */}
            <div className="lifestyle-desk-object absolute bottom-[18%] right-[8%] sm:right-[25%] bg-white/10 backdrop-blur-md border border-white/20 p-2.5 sm:p-4 rounded-2xl flex items-center gap-2 sm:gap-3 shadow-lg">
              <span className="text-xl sm:text-2xl">💻</span>
              <div className="text-left text-white">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">MacBook Pro</p>
                <p className="text-[9px] sm:text-[10px] text-white/70">Connected on Fiber 5G</p>
              </div>
            </div>

            <div className="lifestyle-desk-object absolute bottom-[10%] left-[8%] sm:left-[32%] bg-white/10 backdrop-blur-md border border-white/20 p-2.5 sm:p-4 rounded-2xl flex items-center gap-2 sm:gap-3 shadow-lg">
              <span className="text-xl sm:text-2xl">📓</span>
              <div className="text-left text-white">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Classic Notebook</p>
                <p className="text-[9px] sm:text-[10px] text-white/70">Leather Hardcover bound</p>
              </div>
            </div>
          </div>
        </div>

        {/* Frame 3: Conversion Title Overlay (Massive SHRIMP Graphic) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-30 px-4 sm:px-6">
          <div className="conversion-headline-overlay max-w-5xl flex flex-col gap-4 sm:gap-6 items-center">
            <h2 className="shrimp-display text-white text-4xl sm:text-6xl md:text-7xl lg:text-[7rem] leading-none drop-shadow-lg">
              WHAT ARE YOU <br />
              WAITING FOR?
            </h2>
            <p className="text-white/80 font-bold text-sm sm:text-lg md:text-xl max-w-xl drop-shadow">
              JOIN NOW AND SECURE YOUR ULTIMATE INTELLECTUAL WORKSPACE.
            </p>
            <button
              onClick={() => {
                const formSec = document.getElementById("lead-capture-crm-payload");
                if (formSec) {
                  formSec.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="pointer-events-auto mt-2 sm:mt-6 px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-accent-aqua-core to-[#14B8A6] text-white rounded-full font-bold text-xs sm:text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all duration-300 active:scale-95 cursor-pointer"
            >
              Enquire Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { target: 120, suffix: "+", label: "Ergonomic Cabins", note: "Silent individual seats" },
  { target: 5000, suffix: "+", label: "Students Served", note: "Since launch" },
  { target: 4.9, suffix: "", label: "Google Rating", note: "Out of 5.0 stars", isDecimal: true },
  { target: 15, suffix: " hrs", label: "Daily Access", note: "7 AM to 10 PM" },
  { target: 300, suffix: " Mbps", label: "Fiber Wi-Fi", note: "Dedicated bandwidth" },
];

function Counter({ target, suffix, isDecimal }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const start = performance.now();
          const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 4);
            const val = target * ease;
            setCount(isDecimal ? parseFloat(val.toFixed(1)) : Math.floor(val));
            if (p < 1) requestAnimationFrame(tick);
            else setCount(target);
          };
          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, isDecimal]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}{suffix}
    </span>
  );
}

export default function StatsCounter() {
  return (
    <section className="bg-[#FDFBF7] py-12 md:py-16 border-b border-[#c6c7c0]/20">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-0 divide-y md:divide-y-0 md:divide-x divide-[#c6c7c0]/25">
          {STATS.map((stat, idx) => (
            <div
              key={idx}
              className="px-4 py-8 md:py-6 md:px-8 first:pl-0 last:pr-0 text-left group"
            >
              <div className="font-headline-lg text-3xl sm:text-4xl text-[#1C2421] tabular-nums group-hover:text-[#00A8CC] transition-colors duration-300">
                <Counter target={stat.target} suffix={stat.suffix} isDecimal={stat.isDecimal} />
              </div>
              <p className="font-label-caps text-[10px] sm:text-xs text-[#1C2421] uppercase tracking-widest font-bold mt-1.5">
                {stat.label}
              </p>
              <p className="font-body text-[10px] text-[#767872] mt-0.5 leading-tight">
                {stat.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

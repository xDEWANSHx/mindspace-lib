"use client";

import { useRef, useState, useEffect } from "react";

/**
 * Minimal animated section divider — a thin line that sweeps in from one edge.
 * No background color blocks. Uses the existing page background.
 * @param {"left" | "right"} direction - Which edge the line starts from.
 */
export default function SectionDivider({ direction = "left" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const isLeft = direction === "left";

  return (
    <div
      ref={ref}
      className={`w-full flex ${isLeft ? "justify-start" : "justify-end"} py-2 px-6 sm:px-12 md:px-16`}
    >
      <div
        style={{
          height: "1px",
          width: visible ? "40%" : "0%",
          background: "linear-gradient(to right, #c6c7c0, transparent)",
          transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
          ...(isLeft
            ? {}
            : {
                background: "linear-gradient(to left, #c6c7c0, transparent)",
              }),
        }}
      />
    </div>
  );
}

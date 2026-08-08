"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle, HelpCircle, ExternalLink } from "lucide-react";

export default function GoogleReviewsMarquee() {
  const sectionRef = useRef(null);
  const [intersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const REVIEWS = [
    {
      name: "Ananya Ekka",
      initial: "AE",
      reviewsCount: "1 review",
      color: "#4285F4",
      time: "a month ago",
      badge: "UPSC CSE Aspirant",
      photo: "/assets/student_ananya.png",
      text: "Finally the most comfortable and spacious library is here in Ambikapur. The environment is so good, even the surrounding is also amazing. Highly recommend for each & everyone :)"
    },
    {
      name: "Irfan Ansari",
      initial: "IA",
      reviewsCount: "1 review",
      color: "#EA4335",
      time: "a month ago",
      badge: "CGPSC Aspirant",
      photo: null,
      text: "This library is a great place for reading and learning. It has a quiet environment and helpful staff. The seating arrangement is comfortable, making it an excellent place to study and spend productive time."
    },
    {
      name: "Nitin Bhutani",
      initial: "NB",
      reviewsCount: "3 reviews",
      color: "#34A853",
      time: "a month ago",
      badge: "CA Finalist",
      photo: null,
      text: "Excellent library with a peaceful and disciplined study environment. Clean, comfortable, and perfect for focused preparation. The overall atmosphere is highly motivating. Highly recommended for students and competitive exam aspirants."
    },
    {
      name: "Neha Yadav",
      initial: "NY",
      reviewsCount: "1 review",
      color: "#FBBC05",
      time: "a month ago",
      badge: "SSC CGL Candidate",
      photo: null,
      text: "A well-organized library with a peaceful atmosphere and excellent resources. It inspires students to read, learn, and grow. Overall, a wonderful experience."
    },
    {
      name: "Anjali Mishra",
      initial: "AM",
      reviewsCount: "1 review",
      color: "#4285F4",
      time: "a month ago",
      badge: "Banking Aspirant",
      photo: null,
      text: "Mindspace Library is perfect for serious study. Very clean, silent, and well-maintained with good WiFi, AC, and power backup. The crowd is disciplined and focused. Reasonable fees and helpful staff. Highly recommended!!!"
    },
    {
      name: "Manisha VU",
      initial: "MV",
      reviewsCount: "1 review",
      color: "#EA4335",
      time: "2 months ago",
      badge: "State Services Aspirant",
      photo: null,
      text: "Loved the modern interior and peaceful environment. Best study environment in town."
    },
    {
      name: "Garima Agrawal",
      initial: "GA",
      reviewsCount: "1 review",
      color: "#34A853",
      time: "a month ago",
      badge: "CA Aspirant",
      photo: null,
      text: "Excellent study environment... comfortable seating...perfect for study. Would definitely recommend to all serious students."
    },
    {
      name: "Manisha Digre",
      initial: "MD",
      reviewsCount: "1 review",
      color: "#FBBC05",
      time: "2 months ago",
      badge: "UPSC Aspirant",
      photo: null,
      text: "Best decision to join this library. Comfortable space, proper lighting and a very positive study vibe !!"
    },
    {
      name: "Goldi Agrawal",
      initial: "GA",
      reviewsCount: "5 reviews · 3 photos",
      color: "#4285F4",
      time: "a month ago",
      badge: "Local Guide",
      photo: null,
      text: "Experience of the library was great. It was very hygienic and clean and the staff was very cooperative. The atmosphere is truly inspiring."
    },
    {
      name: "Akanksha Singh",
      initial: "AS",
      reviewsCount: "1 review",
      color: "#EA4335",
      time: "a month ago",
      badge: "Judiciary Aspirant",
      photo: null,
      text: "Excellent study environment, comfortable seating, and complete silence for focused learning. Mind Space Library is the perfect place for serious students. Highly recommended!"
    },
    {
      name: "Dev Singh",
      initial: "DS",
      reviewsCount: "4 reviews",
      color: "#34A853",
      time: "a month ago",
      badge: "Competitive Exam Aspirant",
      photo: null,
      text: "Nice library, good environment, polite behaviour. The staff is always helpful and the cabins are very comfortable for long study sessions."
    },
    {
      name: "Akash Kumar",
      initial: "AK",
      reviewsCount: "1 review",
      color: "#FBBC05",
      time: "a month ago",
      badge: "Student Member",
      photo: null,
      text: "This library is so good and the arrangements are quite good. Really impressed by the facilities and the overall ambience."
    },
    {
      name: "Purnima Agrawal",
      initial: "PA",
      reviewsCount: "1 review",
      color: "#4285F4",
      time: "a month ago",
      badge: "MPSC Aspirant",
      photo: null,
      text: "Excellent library with a peaceful atmosphere and beautiful interior. Clean, quiet, and perfect for focused study sessions. Highly recommended!"
    },
    {
      name: "Isha Pandey",
      initial: "IP",
      reviewsCount: "3 reviews",
      color: "#EA4335",
      time: "a month ago",
      badge: "Medical Aspirant",
      photo: null,
      text: "A spacious and distraction-free study area with excellent lighting and comfortable seating. Perfect for students looking for a calm place to concentrate and prepare for exams."
    },
    {
      name: "Akansha Kujur",
      initial: "AK",
      reviewsCount: "1 review",
      color: "#34A853",
      time: "a month ago",
      badge: "Aspirant",
      photo: null,
      text: "Comfortable seat, fully AC with personal compartment. Really love the dark room section — perfect for deep concentration sessions."
    },
    {
      name: "Rohit Sharma",
      initial: "RS",
      reviewsCount: "2 reviews",
      color: "#EA4335",
      time: "a month ago",
      badge: "NEET PG Top Ranker",
      photo: "/assets/student_rohit.png",
      text: "MindSpace provided me the exact 15-hour daily discipline I needed during my exam revision. 1 Gbps fiber wifi, AC, and Noiric coffee at desk made it seamless!"
    }
  ];

  const ROW_A = [...REVIEWS.slice(0, 8), ...REVIEWS.slice(0, 8)];
  const ROW_B = [...REVIEWS.slice(8), ...REVIEWS.slice(8)];

  function GoogleG() {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-label="Google">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    );
  }

  function StarRow() {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg key={i} viewBox="0 0 20 20" className="w-4 h-4 fill-[#F9AB00]">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
          </svg>
        ))}
      </div>
    );
  }

  function ReviewCard({ rev, keyIdx }) {
    return (
      <div key={keyIdx} className="w-[320px] sm:w-[380px] bg-white rounded-3xl p-6 flex flex-col justify-between gap-4 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-500 border border-[#e8e8e2] cursor-default">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {rev.photo ? (
              <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-[#00A8CC] shadow-sm shrink-0">
                <Image src={rev.photo} alt={rev.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-white text-sm shrink-0 select-none shadow-sm" style={{ background: rev.color }}>
                {rev.initial}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-extrabold text-[#1C2421] text-sm leading-tight">{rev.name}</p>
                <CheckCircle className="w-3.5 h-3.5 text-[#00A8CC]" />
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{rev.reviewsCount}</p>
            </div>
          </div>
          <GoogleG />
        </div>

        <StarRow />

        <p className="text-xs sm:text-sm text-[#3c3c3c] leading-[1.65] line-clamp-4 flex-1 font-medium italic">
          &ldquo;{rev.text}&rdquo;
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-[#f2f2ee] text-[10px] text-slate-400 font-medium">
          <span>{rev.time}</span>
          <div className="flex items-center gap-1 text-[#00A8CC] font-black uppercase tracking-wider">
            <span>{rev.badge}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section id="google-reviews-section" ref={sectionRef} className="py-24 sm:py-32 relative overflow-hidden bg-[#FDFBF7]">
      {/* Subtle Dot Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: "radial-gradient(circle, #d0d0cc 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 mb-12 text-center relative z-10">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
          <GoogleG />
          <span className="font-label-caps text-xs text-[#1C2421] font-extrabold tracking-wider uppercase">
            Official Google Maps Reviews • Ambikapur
          </span>
        </div>
        <h2 className="font-headline-lg text-3xl sm:text-4xl lg:text-5xl text-[#1C2421]">
          Real Feedback from <span className="text-[#00A8CC] italic">MindSpace Students</span>
        </h2>
        <p className="font-body text-xs sm:text-sm text-[#454742] mt-3 max-w-lg mx-auto leading-relaxed">
          Hover over any review card to pause the continuous marquee and read authentic feedback.
        </p>
      </div>

      {/* ── Google 4.8 Rating Summary Card (Matches User Screenshot) ── */}
      <div className="max-w-xl mx-auto px-6 mb-14 relative z-10">
        <a
          href="https://www.google.com/maps/search/?api=1&query=mindspace+library+Manendragarh+Rd+Ambikapur+Chhattisgarh"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-[#e8e8e2] hover:shadow-[0_12px_40px_rgba(0,168,204,0.12)] hover:border-[#00A8CC]/40 transition-all duration-300 group cursor-pointer"
        >
          {/* Summary Header */}
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-headline-md text-sm font-extrabold text-[#1C2421]">Review summary</span>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#00A8CC] font-bold group-hover:underline">
              <span>View on Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Rating Summary Breakdown (Left 4.8 Score + Right 5-Bar Chart) */}
          <div className="grid grid-cols-12 gap-4 items-center">
            
            {/* Left: 4.8 Rating & Stars */}
            <div className="col-span-5 flex flex-col items-center justify-center border-r border-slate-100 pr-4 text-center">
              <span className="font-headline-lg text-5xl sm:text-6xl font-black text-[#1C2421] leading-none">
                4.8
              </span>
              <div className="flex gap-1 my-2">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} viewBox="0 0 20 20" className="w-4 h-4 fill-[#F9AB00]">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                  </svg>
                ))}
              </div>
              <span className="text-xs text-[#00A8CC] font-bold">56 reviews</span>
            </div>

            {/* Right: Star Bar Breakdown (Matching Screenshot) */}
            <div className="col-span-7 space-y-1.5 text-xs font-semibold text-slate-600 pl-2">
              
              {/* 5 Star Bar */}
              <div className="flex items-center gap-2">
                <span className="w-2 text-right shrink-0">5</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#F9AB00] rounded-full w-[88%]" />
                </div>
              </div>

              {/* 4 Star Bar */}
              <div className="flex items-center gap-2">
                <span className="w-2 text-right shrink-0">4</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#F9AB00] rounded-full w-[10%]" />
                </div>
              </div>

              {/* 3 Star Bar */}
              <div className="flex items-center gap-2">
                <span className="w-2 text-right shrink-0">3</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#F9AB00] rounded-full w-[2%]" />
                </div>
              </div>

              {/* 2 Star Bar */}
              <div className="flex items-center gap-2">
                <span className="w-2 text-right shrink-0">2</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#F9AB00] rounded-full w-[1%]" />
                </div>
              </div>

              {/* 1 Star Bar */}
              <div className="flex items-center gap-2">
                <span className="w-2 text-right shrink-0">1</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#F9AB00] rounded-full w-[0%]" />
                </div>
              </div>

            </div>

          </div>
        </a>
      </div>

      {/* ── Infinitely Scrolling Marquee Track Container ── */}
      <div className="relative w-full overflow-hidden space-y-6">
        
        {/* Left & Right Edge Gradient Fades */}
        <div className="absolute top-0 bottom-0 left-0 w-24 sm:w-44 bg-gradient-to-r from-[#FDFBF7] via-[#FDFBF7]/85 to-transparent z-20 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-24 sm:w-44 bg-gradient-to-l from-[#FDFBF7] via-[#FDFBF7]/85 to-transparent z-20 pointer-events-none" />

        {/* Row 1: Leftward Infinite Scroll */}
        <div className="flex gap-6 w-max animate-[marquee_45s_linear_infinite] hover:[animation-play-state:paused]">
          {ROW_A.map((rev, i) => (
            <ReviewCard key={`row1-${i}`} rev={rev} keyIdx={`row1-${i}`} />
          ))}
        </div>

        {/* Row 2: Rightward Infinite Scroll */}
        <div className="flex gap-6 w-max animate-[marqueeReverse_45s_linear_infinite] hover:[animation-play-state:paused]">
          {ROW_B.map((rev, i) => (
            <ReviewCard key={`row2-${i}`} rev={rev} keyIdx={`row2-${i}`} />
          ))}
        </div>

      </div>

      {/* CSS Keyframes for Infinite Smooth Marquee Motion */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marqueeReverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
      `}</style>
    </section>
  );
}

"use client";

import { MapPin, Phone, MessageCircle, Navigation, ExternalLink } from "lucide-react";

export default function LocationSocialSection() {
  const mapsUrl = "https://maps.google.com/maps?q=mindspace+library+Manendragarh+Rd+Ambikapur+Chhattisgarh&t=k&z=17&ie=UTF8&iwloc=&output=embed";

  return (
    <section id="location-social-section" className="w-full bg-[#1C2421] text-white py-20 sm:py-28 relative overflow-hidden border-t border-white/10">
      
      {/* Background Radial Lights */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#00A8CC]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#D4B28C]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col gap-3 text-left max-w-2xl mb-14">
          <div className="flex items-center gap-3">
            <span className="w-10 h-[2px] bg-[#00A8CC]" />
            <span className="font-label-caps text-xs text-[#00A8CC] uppercase tracking-widest font-bold">
              Visit &amp; Connect
            </span>
          </div>
          <h2 className="font-headline-lg text-3xl sm:text-4xl md:text-5xl text-white leading-tight">
            FIND THE <span className="text-[#00A8CC]">SANCTUARY</span>
          </h2>
          <p className="font-body text-sm sm:text-base text-white/70">
            Located on Manendragarh Road, Ambikapur. Connect with us on social handles or drop by for a tour.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Left Column: Interactive Satellite Map Embed (Matching Screenshot) */}
          <div className="lg:col-span-7 bg-[#262F2C] rounded-[32px] overflow-hidden wood-stroke shadow-2xl flex flex-col justify-between min-h-[380px] sm:min-h-[440px] relative group">
            <iframe
              title="MindSpace Library Satellite Location Map"
              src={mapsUrl}
              className="w-full h-full min-h-[340px] sm:min-h-[400px] border-0 opacity-95 contrast-105 transition-all duration-700"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="p-5 sm:p-6 bg-[#1C2421]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-red-500 fill-red-500/20 animate-pulse" />
                </div>
                <div>
                  <p className="font-headline-md text-sm text-white">Mindspace Library, Manendragarh Rd</p>
                  <p className="font-body text-xs text-white/60">Ambikapur, Chhattisgarh 497001</p>
                </div>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=mindspace+library+Manendragarh+Rd+Ambikapur+Chhattisgarh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-label-caps font-bold uppercase tracking-wider transition-all shadow-lg hover:scale-105 cursor-pointer shrink-0"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>

          {/* Right Column: Contact Cards & Social Media (5 Columns Desktop) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            
            {/* Phone & Instant Contact Card */}
            <div className="bg-[#262F2C] rounded-[32px] p-6 sm:p-8 wood-stroke space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4B28C]/20 border border-[#D4B28C]/40 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#D4B28C]" />
                </div>
                <div>
                  <h3 className="font-label-caps text-xs text-[#D4B28C] uppercase font-bold tracking-widest">
                    Direct Contact Lines
                  </h3>
                  <p className="font-body text-xs text-white/60">Speak with Sanctuary Management</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <a
                  href="tel:+917974673138"
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#1C2421] border border-white/10 hover:border-[#00A8CC] transition-all group cursor-pointer"
                >
                  <div>
                    <p className="font-label-caps text-xs text-white/50 uppercase font-bold">Owner</p>
                    <p className="font-headline-md text-base text-white group-hover:text-[#00A8CC] transition-colors">
                      +91 79746 73138
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-[#00A8CC] transition-colors" />
                </a>
              </div>
            </div>

            {/* Social Media Grid */}
            <div className="bg-[#262F2C] rounded-[32px] p-6 sm:p-8 wood-stroke space-y-6">
              <h3 className="font-label-caps text-xs text-[#00A8CC] uppercase font-bold tracking-widest">
                Official Social Media Channels
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/mindspacelibrary01/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#1C2421] border border-white/10 hover:border-[#E1306C] hover:bg-[#E1306C]/10 transition-all cursor-pointer group"
                >
                  <svg className="w-5 h-5 fill-current text-[#E1306C]" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <div>
                    <p className="font-headline-md text-xs text-white">Instagram</p>
                    <p className="text-[10px] text-white/50">@mindspacelibrary01</p>
                  </div>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/917974673138"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#1C2421] border border-white/10 hover:border-[#25D366] hover:bg-[#25D366]/10 transition-all cursor-pointer group"
                >
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                  <div>
                    <p className="font-headline-md text-xs text-white">WhatsApp</p>
                    <p className="text-[10px] text-white/50">+91 79746 73138</p>
                  </div>
                </a>

                {/* Justdial */}
                <a
                  href="https://www.justdial.com/Ambikapur/MINDSPACE-LIBRARY-Goyal-Super-Mart-Ambikapur-Road/9999P7774-7774-260522152951-K6T4_BZDET"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#1C2421] border border-white/10 hover:border-[#FF5600] hover:bg-[#FF5600]/10 transition-all cursor-pointer group"
                >
                  <div className="w-5 h-5 rounded-md bg-[#FF5600] text-white flex items-center justify-center font-black text-[10px]">
                    JD
                  </div>
                  <div>
                    <p className="font-headline-md text-xs text-white">Justdial</p>
                    <p className="text-[10px] text-white/50">Verified Listing</p>
                  </div>
                </a>

                {/* Google Reviews */}
                <a
                  href="https://maps.google.com/maps?q=mindspace+library+Manendragarh+Rd+Ambikapur+Chhattisgarh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#1C2421] border border-white/10 hover:border-[#4285F4] hover:bg-[#4285F4]/10 transition-all cursor-pointer group"
                >
                  <svg className="w-5 h-5 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <div>
                    <p className="font-headline-md text-xs text-white">Google Business</p>
                    <p className="text-[10px] text-white/50">4.9 ★ Rating</p>
                  </div>
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

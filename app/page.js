"use client";

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MantraSection from "@/components/MantraSection";
import BentoMatrix from "@/components/BentoMatrix";
import CinematicScroller from "@/components/CinematicScroller";
import SanctuaryLifeGallery from "@/components/SanctuaryLifeGallery";
import FounderNote from "@/components/FounderNote";
import GoogleReviewsMarquee from "@/components/GoogleReviewsMarquee";
import NoiricCafeSection from "@/components/NoiricCafeSection";
import CoBrandSynergy from "@/components/CoBrandSynergy";
import PricingPlans from "@/components/PricingPlans";
import FaqSection from "@/components/FaqSection";
import EnquiryForm from "@/components/EnquiryForm";
import LocationSocialSection from "@/components/LocationSocialSection";
import CtaBanner from "@/components/CtaBanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7] text-[#151d1a]">
      {/* Dynamic Island Navbar */}
      <Navbar />

      {/* Main Landing Sections in Chronological Order */}
      <main className="flex-1">

        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. Mantra Section (Philosophy Quote) */}
        <MantraSection />

        {/* 3. Sanctuary Architecture (Bento Matrix) */}
        <BentoMatrix />

        {/* 4. Interactive Cabin View Section (Temporarily Commented Out as requested) */}
        {/* <CinematicScroller /> */}

        {/* 5. Sanctuary Gallery */}
        <SanctuaryLifeGallery />

        {/* 6. Founder's Letter */}
        <FounderNote />

        {/* 7. Real Google Reviews */}
        <GoogleReviewsMarquee />

        {/* 8. NOIRIC Collaboration Section */}
        <NoiricCafeSection />

        {/* 9. Features (The MindSpace Experience) */}
        <CoBrandSynergy />

        {/* 10. Pricing & Membership */}
        <PricingPlans />

        {/* 11. FAQ Section */}
        <FaqSection />

        {/* 12. Detailed Enquiry Form */}
        <EnquiryForm />

        {/* 13. Map & Socials */}
        <LocationSocialSection />

        {/* 14. Bottom CTA Banner */}
        <CtaBanner />

      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

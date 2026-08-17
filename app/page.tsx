import Header from "@/components/header";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { StatsSection } from "@/components/landing/stats-section";

export default function LandingPage() {
  return (
    <div className="bg-brand-canvas">
      <div className="sticky top-0 z-50 bg-brand-canvas">
        <Header />
      </div>

      <HeroSection />
      <StatsSection />
      <HowItWorks />
    </div>
  );
}

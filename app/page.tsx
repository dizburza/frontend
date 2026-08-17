import Header from "@/components/header";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { MoneyRulesBand } from "@/components/landing/money-rules-band";
import { StatsSection } from "@/components/landing/stats-section";
import { WhyDizburza } from "@/components/landing/why-dizburza";

export default function LandingPage() {
  return (
    <div className="bg-brand-canvas">
      <div className="sticky top-0 z-50 bg-brand-canvas">
        <Header />
      </div>

      <HeroSection />
      <StatsSection />
      <HowItWorks />
      <WhyDizburza />
      <MoneyRulesBand />
    </div>
  );
}

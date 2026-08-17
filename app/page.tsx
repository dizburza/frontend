import Header from "@/components/header";
import { BuiltForEveryRole } from "@/components/landing/built-for-every-role";
import { FaqSection } from "@/components/landing/faq-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { MoneyRulesBand } from "@/components/landing/money-rules-band";
import { MoveMoneyCta } from "@/components/landing/move-money-cta";
import { SiteFooter } from "@/components/landing/site-footer";
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
      <BuiltForEveryRole />
      <FaqSection />
      <MoveMoneyCta />
      <SiteFooter />
    </div>
  );
}

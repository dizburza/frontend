import Header from "@/components/header";
import { HeroSection } from "@/components/landing/hero-section";

export default function LandingPage() {
  return (
    <div className="bg-brand-canvas">
      <div className="sticky top-0 z-50 bg-brand-canvas">
        <Header />
      </div>

      <HeroSection />
    </div>
  );
}

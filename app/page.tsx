import Header from "@/components/header";
import Hero from "@/components/hero";

export default function LandingPage() {
  return (
    <div className="relative h-screen bg-background overflow-hidden flex flex-col">
      <div className="relative z-10 bg-white shrink-0">
        <Header />
      </div>

      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Gradient orbs for depth */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] -translate-x-1/4" />
      <div className="absolute bottom-0 right-1/3 w-[350px] h-[350px] bg-primary/3 rounded-full blur-[90px] translate-y-1/3" />

      {/* Geometric accent lines */}
      <div className="absolute top-20 left-10 w-32 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute top-40 right-20 w-24 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent rotate-45" />
      <div className="absolute bottom-40 left-1/4 w-40 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent -rotate-12" />
      <div className="relative z-10 flex-1 min-h-0">
        <Hero />
      </div>
    </div>
  );
}

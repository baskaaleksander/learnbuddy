import CTA from "@/components/landing-page/cta";
import Features from "@/components/landing-page/features";
import ForWho from "@/components/landing-page/for-who";
import Hero from "@/components/landing-page/hero";
import HowItWorks from "@/components/landing-page/how-it-works";

export default function Home() {
  return (
    <div>
      <Hero />
      <Features />
      {/* add carousel with screenshots */}
      <HowItWorks />
      <ForWho />
      <CTA />
    </div>
  );
}

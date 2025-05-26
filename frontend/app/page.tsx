import CTA from "@/components/cta";
import Features from "@/components/features";
import ForWho from "@/components/for-who";
import Hero from "@/components/hero";
import HowItWorks from "@/components/how-it-works";

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

import CTA from "@/components/landing-page/cta";
import Features from "@/components/landing-page/features";
import ForWho from "@/components/landing-page/for-who";
import Hero from "@/components/landing-page/hero";
import HowItWorks from "@/components/landing-page/how-it-works";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "LearnBuddy | your AI learning companion",
  description:
    "A platform that simplifies learning and makes it accessible for everyone.",
};

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

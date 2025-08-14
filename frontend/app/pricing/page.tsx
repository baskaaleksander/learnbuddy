import FaqPricing from "@/components/landing-page/faq-pricing";
import Features from "@/components/landing-page/features";
import PricingSection from "@/components/landing-page/pricing-section";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Pricing | LearnBuddy",
  description:
    "Explore our pricing plans and find the perfect fit for your learning needs.",
};

function PricingPage() {
  return (
    <div>
      <PricingSection />
      <Features />
      <FaqPricing />
    </div>
  );
}

export default PricingPage;

import FaqPricing from "@/components/landing-page/faq-pricing";
import Features from "@/components/landing-page/features";
import PricingSection from "@/components/landing-page/pricing-section";
import React from "react";

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

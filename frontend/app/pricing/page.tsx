import FaqPricing from "@/components/faq-pricing";
import Features from "@/components/features";
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

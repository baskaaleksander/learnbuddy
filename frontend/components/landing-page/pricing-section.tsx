"use client";
import React, { useState } from "react";
import PricingCard from "./pricing-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { pricingPlans } from "@/lib/pricing-plans";
import DescriptionSection from "./description-section";

function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  const currentPricing = isYearly ? pricingPlans.yearly : pricingPlans.monthly;

  return (
    <div className="flex flex-col items-center px-[10%] py-4 md:py-12 lg:py-20 text-center">
      <DescriptionSection
        title="Pricing"
        secondaryTitle="Choose the plan that fits your learning journey"
        description="Each token generates one AI-powered summary, quiz, or flashcard set."
      />

      <div className="flex items-center justify-center mt-8 p-1 bg-muted rounded-lg relative">
        <Button
          variant={!isYearly ? "default" : "ghost"}
          size="sm"
          onClick={() => setIsYearly(false)}
          className={cn(
            "px-6 py-2 text-sm transition-all",
            !isYearly && "shadow-sm"
          )}
        >
          Monthly
        </Button>
        <Button
          variant={isYearly ? "default" : "ghost"}
          size="sm"
          onClick={() => setIsYearly(true)}
          className={cn(
            "px-6 py-2 text-sm transition-all",
            isYearly && "shadow-sm"
          )}
        >
          Yearly
        </Button>
        <Badge
          variant="secondary"
          className="absolute -bottom-4 -right-6 text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"
        >
          Save 17%
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-16 md:pt-20 lg:pt-24">
        {currentPricing.map((card) => (
          <PricingCard
            key={`${card.nameOfPlan}-${isYearly ? "yearly" : "monthly"}`}
            {...card}
          />
        ))}
      </div>
    </div>
  );
}

export default PricingSection;

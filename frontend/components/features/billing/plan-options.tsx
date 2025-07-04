"use client";
import React, { useState } from "react";
import PricingCard from "@/components/landing-page/pricing-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { pricingPlans } from "@/lib/pricing-plans";

function PlanOptions({
  selectedPlan,
  setSelectedPlan,
  isYearly,
  setIsYearly,
}: {
  selectedPlan?: string | null;
  setSelectedPlan: (plan: string) => void;
  isYearly: boolean;
  setIsYearly: (isYearly: boolean) => void;
}) {
  const currentPricing = isYearly ? pricingPlans.yearly : pricingPlans.monthly;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 justify-center p-1 rounded-lg relative">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentPricing.map((card, idx) => (
          <PricingCard
            key={`${card.nameOfPlan}-${isYearly ? "yearly" : "monthly"}`}
            {...card}
            isSelectable={true}
            isSelected={selectedPlan === card.nameOfPlan}
            onSelect={() => setSelectedPlan(card.nameOfPlan)}
          />
        ))}
      </div>
    </div>
  );
}

export default PlanOptions;

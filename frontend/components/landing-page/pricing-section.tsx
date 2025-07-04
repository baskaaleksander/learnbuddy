"use client";
import React, { useState } from "react";
import PricingCard from "./pricing-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  const pricingPlans = {
    monthly: [
      {
        nameOfPlan: "Free",
        price: "$0",
        description: "Perfect for trying out LearnBuddy.",
        tokenLimit: "12 tokens",
        features: [
          { name: "AI-generated summaries", isAvailable: true },
          { name: "AI-generated quizzes", isAvailable: true },
          { name: "AI-generated flashcards", isAvailable: true },
          { name: "Premium support", isAvailable: false },
          { name: "Export to PDF/other formats", isAvailable: false },
        ],
      },
      {
        nameOfPlan: "Tier 1",
        price: "$4.99",
        description: "Great for regular learners and students.",
        tokenLimit: "100 tokens",
        features: [
          { name: "AI-generated summaries", isAvailable: true },
          { name: "AI-generated quizzes", isAvailable: true },
          { name: "AI-generated flashcards", isAvailable: true },
          { name: "Priority support", isAvailable: true },
          { name: "Export to PDF/other formats", isAvailable: false },
        ],
      },
      {
        nameOfPlan: "Tier 2",
        price: "$9.99",
        description: "Ideal for serious learners and professionals.",
        tokenLimit: "300 tokens",
        features: [
          { name: "AI-generated summaries", isAvailable: true },
          { name: "AI-generated quizzes", isAvailable: true },
          { name: "AI-generated flashcards", isAvailable: true },
          { name: "Priority support", isAvailable: true },
          { name: "Export to PDF/other formats", isAvailable: true },
        ],
      },
      {
        nameOfPlan: "Unlimited",
        price: "$19.99",
        description: "Best for power users and organizations.",
        tokenLimit: "Unlimited tokens",
        features: [
          { name: "AI-generated summaries", isAvailable: true },
          { name: "AI-generated quizzes", isAvailable: true },
          { name: "AI-generated flashcards", isAvailable: true },
          { name: "Premium support", isAvailable: true },
          { name: "Export to PDF/other formats", isAvailable: true },
        ],
      },
    ],
    yearly: [
      {
        nameOfPlan: "Free",
        price: "$0",
        description: "Perfect for trying out LearnBuddy.",
        tokenLimit: "12 tokens",
        features: [
          { name: "AI-generated summaries", isAvailable: true },
          { name: "AI-generated quizzes", isAvailable: true },
          { name: "AI-generated flashcards", isAvailable: true },
          { name: "Premium support", isAvailable: false },
          { name: "Export to PDF/other formats", isAvailable: false },
        ],
      },
      {
        nameOfPlan: "Tier 1",
        price: "$49",
        description: "Great for regular learners and students.",
        tokenLimit: "100 tokens",
        features: [
          { name: "AI-generated summaries", isAvailable: true },
          { name: "AI-generated quizzes", isAvailable: true },
          { name: "AI-generated flashcards", isAvailable: true },
          { name: "Priority support", isAvailable: true },
          { name: "Export to PDF/other formats", isAvailable: false },
        ],
      },
      {
        nameOfPlan: "Tier 2",
        price: "$99",
        description: "Ideal for serious learners and professionals.",
        tokenLimit: "300 tokens",
        features: [
          { name: "AI-generated summaries", isAvailable: true },
          { name: "AI-generated quizzes", isAvailable: true },
          { name: "AI-generated flashcards", isAvailable: true },
          { name: "Priority support", isAvailable: true },
          { name: "Export to PDF/other formats", isAvailable: true },
        ],
      },
      {
        nameOfPlan: "Unlimited",
        price: "$199",
        description: "Best for power users and organizations.",
        tokenLimit: "Unlimited tokens",
        features: [
          { name: "AI-generated summaries", isAvailable: true },
          { name: "AI-generated quizzes", isAvailable: true },
          { name: "AI-generated flashcards", isAvailable: true },
          { name: "Premium support", isAvailable: true },
          { name: "Export to PDF/other formats", isAvailable: true },
        ],
      },
    ],
  };

  const currentPricing = isYearly ? pricingPlans.yearly : pricingPlans.monthly;

  return (
    <div className="flex flex-col items-center px-[10%] py-4 md:py-12 lg:py-20 text-center">
      <h2 className="text-primary text-lg font-semibold">Pricing</h2>
      <h3 className="text-3xl font-semibold mt-4">
        Choose the plan that fits your learning journey
      </h3>
      <p className="mt-4 md:mt-6 text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-3xl text-center">
        Each token generates one AI-powered summary, quiz, or flashcard set.
        Upgrade anytime as your learning needs grow.
      </p>

      {/* Billing Toggle */}
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
          Save 20%
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-16 md:pt-20 lg:pt-24">
        {currentPricing.map((card, idx) => (
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

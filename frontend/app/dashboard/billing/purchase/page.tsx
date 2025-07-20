"use client";
import ErrorComponent from "@/components/common/error-component";
import LoadingScreen from "@/components/common/loading-screen";
import PlanOptions from "@/components/features/billing/plan-options";
import PurchaseSummary from "@/components/features/billing/purchase-summary";
import { CurrentPlanData } from "@/lib/definitions";
import api from "@/utils/axios";
import React, { useEffect, useState } from "react";

function PurchasePage() {
  const [currentPlan, setCurrentPlan] = useState<CurrentPlanData | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("Free");

  useEffect(() => {
    const fetchPlanData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<CurrentPlanData>(
          "/billing/get-user-subscription"
        );
        setCurrentPlan(response.data);
        // Only set selectedPlan if user has a plan, otherwise keep "Free"
        if (response.data?.planName) {
          setSelectedPlan(response.data.planName);
        }
      } catch (error) {
        console.error("Failed to fetch plan data:", error);
        setError("Failed to fetch plan data. Please try again later.");
        // User has no plan, keep selectedPlan as "Free"
        setCurrentPlan(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPlanData();
  }, []);

  useEffect(() => {
    const fetchPriceChange = async () => {
      if (!currentPlan || selectedPlan === "Free") {
        setPriceChange(null);
        return;
      }

      const hasExactPlan =
        currentPlan?.planName.toLowerCase() === selectedPlan.toLowerCase() &&
        currentPlan?.planInterval.toLowerCase() ===
          (isYearly ? "yearly" : "monthly");

      if (hasExactPlan) {
        setPriceChange(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await api.get(
          `/billing/check-price-change?planName=${encodeURIComponent(
            selectedPlan
          )}&planInterval=${isYearly ? "yearly" : "monthly"}`
        );
        setPriceChange(response.data.totalChange);
      } catch (error) {
        console.error("Failed to fetch price change:", error);
        setError("Failed to fetch price change. Please try again later.");
        setPriceChange(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPriceChange();
  }, [
    selectedPlan,
    isYearly,
    currentPlan?.planName,
    currentPlan?.planInterval,
  ]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorComponent message={error} />;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-center md:text-start">
        Choose the plan that fits your learning journey
      </h1>
      <PlanOptions
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
        isYearly={isYearly}
        setIsYearly={setIsYearly}
      />
      <PurchaseSummary
        currentPlanData={currentPlan}
        priceChange={priceChange}
        selectedPlan={selectedPlan}
        isYearly={isYearly}
      />
    </div>
  );
}

export default PurchasePage;

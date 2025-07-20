"use client";
import ErrorComponent from "@/components/common/error-component";
import LoadingScreen from "@/components/common/loading-screen";
import CurrentPlanInfo from "@/components/features/billing/current-plan-info";
import { CurrentPlanData } from "@/lib/definitions";
import api from "@/utils/axios";
import React, { useEffect, useState } from "react";

function BillingPage() {
  const [planData, setPlanData] = useState<CurrentPlanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchPlanData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<CurrentPlanData>(
          "/billing/get-user-subscription"
        );
        if (response.data.planName === "Free") {
          setPlanData(null);
          return;
        }
        setPlanData(response.data);
      } catch (error) {
        console.error("Failed to fetch plan data:", error);
        setError("Failed to fetch plan data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlanData();
  }, []);

  if (error) {
    return <ErrorComponent message={error} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="text-center md:text-start">
        <h1 className="text-2xl font-bold">Billing Information</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here you can view your current subscription plan and manage your
          billing settings.
        </p>
      </div>
      {planData ? <CurrentPlanInfo data={planData} /> : <CurrentPlanInfo />}
    </div>
  );
}

export default BillingPage;

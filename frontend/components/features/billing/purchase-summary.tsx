import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrentPlanData } from "@/lib/definitions";
import { pricingPlans } from "@/lib/pricing-plans";
import { Loader2, CreditCard, TrendingUp, ArrowRight } from "lucide-react";
import React, { useState } from "react";
import api from "@/utils/axios";
import { toast } from "sonner";

function PurchaseSummary({
  currentPlanData,
  priceChange,
  selectedPlan = "Free",
  isYearly = false,
}: {
  currentPlanData: CurrentPlanData | null;
  priceChange: number | null;
  selectedPlan: string;
  isYearly: boolean;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedInterval = isYearly ? "yearly" : "monthly";
  const planData = pricingPlans[selectedInterval].find(
    (p) => p.nameOfPlan.toLowerCase() === selectedPlan.toLowerCase()
  );

  const planHierarchy = { free: 0, "tier 1": 1, "tier 2": 2, unlimited: 3 };
  const getPlanTier = (planName: string | undefined) =>
    planHierarchy[
      (planName?.toLowerCase() || "free") as keyof typeof planHierarchy
    ] ?? 0;

  const currentPlanTier = getPlanTier(currentPlanData?.planName);
  const selectedPlanTier = getPlanTier(selectedPlan);

  const isUpgrade = selectedPlanTier > currentPlanTier;
  const isDowngrade = selectedPlanTier < currentPlanTier;
  const isSameTier = selectedPlanTier === currentPlanTier;

  const hasExactPlan =
    currentPlanData?.planName?.toLowerCase() === selectedPlan.toLowerCase() &&
    currentPlanData?.planInterval?.toLowerCase() === selectedInterval;

  const isSwitchingInterval =
    isSameTier &&
    currentPlanData?.planInterval?.toLowerCase() !== selectedInterval;

  const isValidChange = isUpgrade || isSwitchingInterval || isDowngrade;
  const isSelectingFreeWithNoPlan = !currentPlanData && selectedPlan === "Free";

  const handleCheckout = async () => {
    if (!isValidChange || selectedPlan === "Free") return;

    setIsProcessing(true);
    try {
      const payload = {
        planName: selectedPlan,
        planInterval: selectedInterval,
      };
      if (currentPlanData?.status === "active") {
        await api.patch("/billing/update-subscription", payload);
        toast.success("Subscription updated successfully!");
        window.location.href = "/dashboard/billing";
      } else {
        const response = await api.post(
          "/billing/create-checkout-session",
          payload
        );
        window.location.href = response.data;
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to process request. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: string) => (price === "Free" ? "$0" : price);

  const getPriceChangeDisplay = () => {
    if (!currentPlanData || !priceChange || priceChange <= 0 || hasExactPlan) {
      return null;
    }

    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <TrendingUp className="h-4 w-4" />
        <span>+${priceChange.toFixed(2)} prorated today</span>
      </div>
    );
  };

  const getButtonText = () => {
    if (isSelectingFreeWithNoPlan || hasExactPlan) return "Current Plan";
    if (selectedPlan === "Free") return "Downgrade to Free";
    if (isDowngrade) return "Downgrade Plan";
    if (currentPlanData?.status === "active") {
      return isUpgrade ? "Upgrade Plan" : "Switch Billing";
    }
    return "Subscribe Now";
  };

  const isButtonDisabled =
    isProcessing || isSelectingFreeWithNoPlan || hasExactPlan;

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <h2 className="text-lg font-semibold">Purchase Summary</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentPlanData && currentPlanData.planName !== "Free" ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Plan:</span>
              <Badge variant="outline">
                {currentPlanData.planName} ({currentPlanData.planInterval})
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Price:</span>
              <span className="font-medium">
                ${currentPlanData.price}/{currentPlanData.planInterval}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Plan:</span>
              <Badge variant="outline">Free</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Price:</span>
              <span className="font-medium">$0/month</span>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Selected Plan:</span>
            <div className="text-right">
              <div className="font-semibold">{selectedPlan}</div>
              <div className="text-sm text-muted-foreground">
                {isYearly ? "Yearly" : "Monthly"}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Price:</span>
            <div className="text-right">
              <div className="font-semibold text-lg">
                {formatPrice(planData?.price || "Free")}
                {planData?.price !== "Free" && (
                  <span className="text-sm text-muted-foreground font-normal">
                    /{isYearly ? "year" : "month"}
                  </span>
                )}
              </div>
              {isYearly && planData?.price !== "Free" && (
                <div className="text-xs text-green-600">
                  Save 20% with yearly billing
                </div>
              )}
            </div>
          </div>

          {planData && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Token Limit:</span>
              <span className="font-medium">{planData.tokenLimit}</span>
            </div>
          )}
        </div>

        {getPriceChangeDisplay() && (
          <div className="border-t border-gray-200 pt-4">
            {getPriceChangeDisplay()}
          </div>
        )}

        {hasExactPlan && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 text-sm text-blue-800 dark:text-blue-200">
            <strong>Current Plan</strong>
            <p className="mt-1">You already have this plan active.</p>
          </div>
        )}

        {isSelectingFreeWithNoPlan && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 text-sm text-blue-800 dark:text-blue-200">
            <strong>Free Plan</strong>
            <p className="mt-1">
              You&apos;re currently on the Free plan with basic features.
            </p>
          </div>
        )}

        {!currentPlanData && selectedPlan !== "Free" && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-3 text-sm text-green-800 dark:text-green-200">
            <strong>Welcome!</strong>
            <p className="mt-1">
              Start your learning journey with our {selectedPlan} plan.
            </p>
          </div>
        )}

        {isDowngrade && selectedPlan !== "Free" && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 text-sm text-blue-800 dark:text-blue-200">
            <strong>Downgrade Information</strong>
            <p className="mt-1">
              You&apos;ll receive a prorated refund for the unused portion of
              your current billing period.
            </p>
          </div>
        )}

        {selectedPlan === "Free" &&
          currentPlanData &&
          currentPlanData.planName !== "Free" && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md p-3 text-sm text-orange-800 dark:text-orange-200">
              <strong>Downgrade to Free</strong>
              <p className="mt-1">
                Your subscription will be cancelled and you&apos;ll receive a
                full refund for the unused portion of your billing period.
              </p>
            </div>
          )}

        <Button
          onClick={handleCheckout}
          disabled={isButtonDisabled}
          variant={isButtonDisabled ? "outline" : "default"}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              {!isButtonDisabled && selectedPlan !== "Free" && (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              {getButtonText()}
              {!isButtonDisabled && selectedPlan !== "Free" && (
                <ArrowRight className="h-4 w-4 ml-2" />
              )}
            </>
          )}
        </Button>

        {!isButtonDisabled && selectedPlan !== "Free" && (
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>
              {currentPlanData?.status === "active"
                ? "Changes will be applied immediately with prorated billing."
                : "You'll be redirected to secure checkout to complete your subscription."}
            </p>
            <p>Cancel anytime from your billing dashboard.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PurchaseSummary;

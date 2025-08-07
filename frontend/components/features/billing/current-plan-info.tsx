import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrentPlanData } from "@/lib/definitions";
import {
  CreditCard,
  Calendar,
  Zap,
  Crown,
  ArrowUpRight,
  X,
  RefreshCcw,
} from "lucide-react";
import React, { useState } from "react";
import Link from "next/link";
import CancelSubDialog from "./cancel-sub-dialog";
import api from "@/utils/axios";
import { toast } from "sonner";

function CurrentPlanInfo({ data }: { data?: CurrentPlanData }) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState<boolean>(false);
  const [cancelSubmitting, setCancelSubmitting] = useState<boolean>(false);

  const handleCancelSubscription = async () => {
    setCancelSubmitting(true);
    try {
      await api.post("/billing/cancel-subscription");
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
    } finally {
      setCancelSubmitting(false);
      setCancelDialogOpen(false);
      toast.success("Subscription cancelled successfully.");
    }
  };

  if (!data) {
    return (
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
            <Crown className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Get Started with a Plan</h2>
          <p className="text-muted-foreground">
            No current plan information available. Choose a plan to unlock all
            features!
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <Link href="/dashboard/billing/purchase">
            <Button size="sm" className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Subscribe Now
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isUnlimited = data.planName.toLowerCase() === "unlimited";
  const tokenUsagePercentage = isUnlimited
    ? 0
    : (data.tokensUsed / data.tokensLimit) * 100;

  const getUsageBadgeVariant = () => {
    if (isUnlimited) return "default";
    if (tokenUsagePercentage >= 90) return "destructive";
    if (tokenUsagePercentage >= 70) return "secondary";
    return "default";
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-all">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Current Plan</h2>
              <p className="text-sm text-muted-foreground">
                Subscription details
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Crown className="h-4 w-4" />
              <span>Plan Name</span>
            </div>
            <p className="font-semibold text-lg">
              {data.planName.charAt(0).toUpperCase() + data.planName.slice(1)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Billing Cycle</span>
            </div>
            <p className="font-semibold text-lg capitalize">
              {data.planInterval}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span>Price</span>
            </div>
            <p className="font-semibold text-lg">
              {data.price} {data.currency.toUpperCase()}
              <span className="text-sm text-muted-foreground font-normal">
                /{data.planInterval}
              </span>
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Cycle ending</span>
            </div>
            <p className="font-semibold text-lg">
              {new Date(data.nextBillingDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium">Token Usage (current month)</span>
            </div>
            <Badge variant={getUsageBadgeVariant()} className="text-xs">
              {isUnlimited
                ? "Unlimited"
                : `${tokenUsagePercentage.toFixed(0)}% used`}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Used: {data.tokensUsed.toLocaleString()}
              </span>
              <span className="text-muted-foreground">
                Limit:{" "}
                {isUnlimited ? "Unlimited" : data.tokensLimit.toLocaleString()}
              </span>
            </div>
            {!isUnlimited && (
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(tokenUsagePercentage, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-6 border-t border-gray-200">
        <Link href="/dashboard/billing/purchase" className="flex-1">
          <Button size="sm" variant="outline" className="w-full">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Change Plan
          </Button>
        </Link>
        {data.status === "active" ? (
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={() => setCancelDialogOpen(true)}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        ) : (
          <Link href="/dashboard/billing/purchase" className="flex-1">
            <Button size="sm" className="w-full">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reactivate
            </Button>
          </Link>
        )}
      </CardFooter>
      <CancelSubDialog
        onDeleteAction={handleCancelSubscription}
        isOpen={cancelDialogOpen}
        setIsOpenAction={setCancelDialogOpen}
        submitting={cancelSubmitting}
      />
    </Card>
  );
}

export default CurrentPlanInfo;

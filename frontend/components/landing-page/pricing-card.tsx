import React from "react";
import { Check, X, Zap } from "lucide-react";
import { PricingCardProps } from "@/lib/definitions";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function PricingCard(pricingCardProps: PricingCardProps) {
  const isPopular = pricingCardProps.nameOfPlan?.toLowerCase().includes("2");
  const isFree = pricingCardProps.nameOfPlan?.toLowerCase().includes("free");
  const isUnlimited = pricingCardProps.nameOfPlan
    ?.toLowerCase()
    .includes("unlimited");

  return (
    <Card
      className={cn(
        "relative flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-200",
        isPopular && "border-primary ring-1 ring-primary/20"
      )}
    >
      {isPopular && (
        <Badge
          variant="default"
          className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10"
        >
          Most Popular
        </Badge>
      )}

      {isUnlimited && (
        <Badge
          variant="secondary"
          className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10 bg-gradient-to-r from-purple-500 to-blue-500 text-white"
        >
          Best Value
        </Badge>
      )}

      <CardHeader className="text-center pb-4">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-foreground">
            {pricingCardProps.nameOfPlan}
          </h3>

          <div
            className={cn(
              "mx-auto w-fit px-3 py-1 rounded-full text-sm font-medium",
              isFree &&
                "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
              pricingCardProps.nameOfPlan?.toLowerCase().includes("starter") &&
                "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
              isPopular && "bg-primary/10 text-primary",
              isUnlimited &&
                "bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 dark:from-purple-900/30 dark:to-blue-900/30 dark:text-purple-400"
            )}
          >
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              {pricingCardProps.tokenLimit}
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {pricingCardProps.price}
              {!isFree && (
                <span className="text-base font-normal text-muted-foreground">
                  /month
                </span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {pricingCardProps.description}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <ul className="space-y-3">
          {pricingCardProps.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {feature.isAvailable ? (
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <X className="h-3 w-3 text-gray-400" />
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "text-sm leading-relaxed",
                  feature.isAvailable
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-6">
        <Button
          asChild
          className={cn(
            "w-full",
            isPopular && "bg-primary hover:bg-primary/90",
            isUnlimited &&
              "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          )}
          variant={isFree ? "outline" : "default"}
        >
          <Link href="/register">
            {isFree ? "Get Started Free" : "Get Started"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default PricingCard;

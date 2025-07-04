import { CurrentPlanData } from "@/lib/definitions";
import React from "react";

function CurrentPlanInfo(currentPlanData: CurrentPlanData) {
  const {
    planName,
    price,
    createdAt,
    nextBillingDate,
    tokensUsed,
    tokensLimit,
  } = currentPlanData;
  return <div>CurrentPlanInfo</div>;
}

export default CurrentPlanInfo;

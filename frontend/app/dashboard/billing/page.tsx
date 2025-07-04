"use client";
import { useSearchParams } from "next/navigation";
import React from "react";

function BillingPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const interval = searchParams.get("interval");

  return (
    <div>
      BillingPage {plan} {interval}
    </div>
  );
}

export default BillingPage;

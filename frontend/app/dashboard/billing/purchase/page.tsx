"use client";
import { useSearchParams } from "next/navigation";
import React from "react";

function PurchasePage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const interval = searchParams.get("interval");

  return <div>PurchasePage</div>;
}

export default PurchasePage;

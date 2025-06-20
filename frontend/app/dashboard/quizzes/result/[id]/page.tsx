"use client";
import React, { use } from "react";

function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  return <div>ResultPage {id}</div>;
}

export default ResultPage;

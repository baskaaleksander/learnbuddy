"use client";
import React, { use } from "react";

function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  return <div>ResultsPage {id}</div>;
}

export default ResultsPage;

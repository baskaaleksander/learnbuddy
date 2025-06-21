"use client";
import ErrorComponent from "@/components/error-component";
import LoadingScreen from "@/components/loading-screen";
import { fetchGraphQL } from "@/utils/gql-axios";
import React, { use, useEffect, useState } from "react";

function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const [results, setResults] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const resultsResponse = await fetchGraphQL(``);

        if (resultsResponse.getQuizResultByQuizId.data) {
          setResults(resultsResponse.getQuizResultByQuizId.data);
        } else {
          setError("Results not found");
        }
      } catch (error) {
        console.error("Error fetching results:", error);
        setError("Failed to fetch results. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [id]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorComponent message={error} />;
  }

  return <div>ResultPage {id}</div>;
}

export default ResultPage;

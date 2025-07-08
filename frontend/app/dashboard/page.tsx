"use client";
import { UserStats } from "@/lib/definitions";
import { useAuth } from "@/providers/auth-provider";
import { fetchGraphQL } from "@/utils/gql-axios";
import React, { useEffect, useState } from "react";

function DashboardPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user || authLoading) {
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetchGraphQL(`
          query GetUserStats {
            getUserStats {
                materialsCount
                quizzesCount
                flashcardsCount
                summariesCount
                totalQuizResults
                totalFlashcardsToReview
                quizPartialsIds
                totalFlashcardsKnown
                recentlyCreatedMaterials {
                    id
                    userId
                    title
                    description
                    content
                    status
                    createdAt
                }
            }
        }
          `);

        if (response.getUserStats) {
          setUserStats(response.getUserStats);
        }
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
        setError("Failed to fetch user stats. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserStats();
  }, [user]);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-medium">
        Welcome, {user?.firstName}
      </h1>
    </div>
  );
}

export default DashboardPage;

"use client";
import ErrorComponent from "@/components/common/error-component";
import LoadingScreen from "@/components/common/loading-screen";
import AssetsStats from "@/components/features/dashboard/assets-stats";
import QuizPartials from "@/components/features/dashboard/quiz-partials";
import RecentlyCreatedAiOutputs from "@/components/features/dashboard/recently-created-ai-outputs";
import RecentlyCreatedMaterials from "@/components/features/dashboard/recently-created-materials";
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
                totalFlashcardsKnown
                recentlyCreatedMaterials {
                    id
                    userId
                    title
                    description
                    status
                    createdAt
                }
                recentlyCreatedAiOutputs {
                  id
                  materialId
                  type
                  createdAt
                  errorMessage
                  material {
                    id
                    title
                  }
                }
                quizPartials {
                  id
                  userId
                  quizId
                  currentQuestionIndex
                  lastUpdated
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

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorComponent message={error} />;
  }
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
        Welcome back, {user?.firstName}!
      </h1>
      <AssetsStats
        materialsCount={userStats?.materialsCount || 0}
        quizzesCount={userStats?.quizzesCount || 0}
        flashcardsCount={userStats?.flashcardsCount || 0}
        summariesCount={userStats?.summariesCount || 0}
        totalFlashcardsKnown={userStats?.totalFlashcardsKnown || 0}
        totalFlashcardsToReview={userStats?.totalFlashcardsToReview || 0}
      />
      <div className="flex flex-col md:flex-row gap-4">
        <RecentlyCreatedMaterials
          recentlyCreatedMaterials={userStats?.recentlyCreatedMaterials || []}
        />
        <RecentlyCreatedAiOutputs
          aiOutputsData={userStats?.recentlyCreatedAiOutputs || []}
        />
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <QuizPartials
          quizPartialsData={userStats?.quizPartials || []}
          totalQuizResults={userStats?.totalQuizResults || 0}
        />
      </div>
    </div>
  );
}

export default DashboardPage;

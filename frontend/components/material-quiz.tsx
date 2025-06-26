"use client";

import { fetchGraphQL } from "@/utils/gql-axios";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  RefreshCw,
  Play,
  Trophy,
  Target,
  Clock,
  ArrowRight,
  Trash,
  Check,
} from "lucide-react";
import Link from "next/link";
import { GenerateAssetDialog } from "@/components/generate-asset";
import DeleteAssetDialog from "./delete-asset-dialog";
import { toast } from "sonner";

function MaterialQuiz({
  id,
  className,
  onAssetChange,
}: {
  id: string;
  className?: string;
  onAssetChange: () => void;
}) {
  const [quizzes, setQuizzes] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState<boolean>(false);
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const [submittingGenerate, setSubmittingGenerate] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [submittingRegenerate, setSubmittingRegenerate] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] =
    useState<boolean>(false);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        setError(null);
        const quizResponse = await fetchGraphQL(`
                    query GetQuizzesByMaterial {
                        getQuizzesByMaterial(materialId: "${id}") {
                            id
                            createdAt
                            averageScore
                            totalAttempts
                            averagePercentage
                            bestScore
                            latestResult {
                                score
                                completedAt
                            }
                        }
                    }
                `);
        if (quizResponse.getQuizzesByMaterial) {
          setQuizzes(quizResponse.getQuizzesByMaterial);
        }
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        setError("Failed to fetch quizzes. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [id, quizzes?.id]);

  const assetData = {
    title: "Quiz",
    description: "Generate quiz for this material",
    cost: 2,
  };

  const handleDeleteQuiz = async () => {
    try {
      setSubmittingDelete(true);
      setError(null);
      await fetchGraphQL(`
                mutation DeleteQuiz {
                    deleteQuiz(id: "${id}")
                }
            `);
      toast("Quiz deleted successfully.", {
        duration: 3000,
        icon: <Trash className="w-4 h-4" />,
      });
      onAssetChange();
    } catch (error) {
      setError("Failed to delete material. Please try again later.");
      toast.error("Failed to delete quiz. Please try again later.");
    } finally {
      setSubmittingDelete(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleRegenerateQuiz = async () => {
    try {
      setSubmittingRegenerate(true);
      setError(null);
      await fetchGraphQL(`
            mutation RegenerateQuiz {
              regenerateQuiz(materialId: "${id}")
            }
          `);
      toast("Quiz regenerated successfully.", {
        duration: 3000,
        icon: <RefreshCw className="w-4 h-4" />,
      });
      onAssetChange();
    } catch (error) {
      setError("Failed to regenerate summary. Please try again later.");
    } finally {
      setSubmittingRegenerate(false);
      setRegenerateDialogOpen(false);
    }
  };

  const handleGenerateQuiz = async () => {
    try {
      setSubmittingGenerate(true);
      setError(null);
      await fetchGraphQL(`
            mutation CreateQuiz {
                createQuiz(materialId: "${id}")
            }
          `);
      toast("Quiz generated successfully.", {
        duration: 3000,
        icon: <Check className="w-4 h-4" />,
      });
      onAssetChange();
    } catch (error) {
      setError("Failed to generate summary. Please try again later.");
    } finally {
      setSubmittingGenerate(false);
      setGenerateDialogOpen(false);
    }
  };

  return (
    <Card
      className={cn(
        "flex h-full flex-col shadow-sm border-gray-200 dark:border-gray-800",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-semibold">Quiz</h2>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">
              Loading...
            </span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center flex-1">
            <p className="text-sm text-destructive text-center">{error}</p>
          </div>
        ) : !quizzes ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="mb-4">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                No quizzes available for this material.
              </p>
            </div>
            {/*<Button variant='outline' size="sm">*/}
            {/*    Generate quiz*/}
            {/*</Button>*/}

            <GenerateAssetDialog
              isOpen={generateDialogOpen}
              setIsOpenAction={setGenerateDialogOpen}
              onGenerateAction={handleGenerateQuiz}
              assetData={assetData}
              submitting={submittingGenerate}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Stats Section */}
            <div className="space-y-4 mb-6">
              {/* Top Row - Main Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="text-xl font-bold">{quizzes.bestScore}</div>
                  <div className="text-xs text-muted-foreground">
                    Best Score
                  </div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Target className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-xl font-bold">
                    {quizzes.averageScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Score</div>
                </div>
              </div>

              {/* Bottom Row - Secondary Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-lg font-semibold">
                    {quizzes.totalAttempts}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Attempts
                  </div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center justify-center mb-2">
                    <Badge
                      variant={
                        quizzes.averagePercentage >= 80
                          ? "default"
                          : quizzes.averagePercentage >= 60
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-xs px-2 py-1"
                    >
                      {quizzes.averagePercentage.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Average percentage rate
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4 p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Latest attempt</h4>
                <span className="text-xs text-muted-foreground">
                  {quizzes.latestResult &&
                    new Date(
                      quizzes?.latestResult?.completedAt
                    ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {quizzes.latestResult ? (
                  <div className="flex items-end justify-between w-full">
                    <Badge
                      variant={
                        quizzes?.averageScore >= 8
                          ? "default"
                          : quizzes?.averageScore >= 6
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {quizzes?.latestResult?.score.toFixed(1)}/10
                    </Badge>
                    <Link
                      href={`/dashboard/quizzes/${quizzes?.id}/results/`}
                      className="text-xs text-muted-foreground"
                    >
                      View all results
                      <ArrowRight className="inline h-3 w-3 ml-1" />
                    </Link>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Take your first try now!
                  </p>
                )}
              </div>
            </div>

            <div className="mt-auto space-y-2">
              <Button asChild className="w-full" size="sm">
                <Link href={`/dashboard/quizzes/${quizzes?.id}`}>
                  <Play className="h-4 w-4 mr-2" />
                  Take Quiz
                </Link>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <GenerateAssetDialog
                  isOpen={regenerateDialogOpen}
                  setIsOpenAction={setRegenerateDialogOpen}
                  assetData={assetData}
                  onGenerateAction={handleRegenerateQuiz}
                  submitting={submittingRegenerate}
                  triggerText="Regenerate"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete
                </Button>
                <DeleteAssetDialog
                  isOpen={deleteDialogOpen}
                  setIsOpenAction={setDeleteDialogOpen}
                  onDeleteAction={handleDeleteQuiz}
                  submitting={submittingDelete}
                  name="Quiz"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MaterialQuiz;

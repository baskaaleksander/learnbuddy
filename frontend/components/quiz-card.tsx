import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Target,
  Trophy,
  Calendar,
  TrendingUp,
  ExternalLink,
  MoreVertical,
  ArrowRight,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { QuizData } from "@/lib/definitions";
import { formatDate } from "@/utils/format-date";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import DeleteAssetDialog from "./delete-asset-dialog";
import { fetchGraphQL } from "@/utils/gql-axios";
import { toast } from "sonner";

function QuizCard({
  quizData,
  className,
  onQuizDeleted,
}: {
  quizData: QuizData;
  className?: string;
  onQuizDeleted?: () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false);
  const needsAttention = () => {
    const lowScore = quizData.averagePercentage < 60;
    const noAttempts = quizData.totalAttempts === 0;

    if (noAttempts) return true;

    const lastAttemptDate = quizData.latestResult?.completedAt
      ? new Date(quizData.latestResult.completedAt)
      : new Date(quizData.createdAt);
    const daysSinceLastAttempt = Math.floor(
      (Date.now() - lastAttemptDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return lowScore || daysSinceLastAttempt > 7;
  };

  const handleMaterialClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    window.location.href = `/dashboard/materials/${quizData.material.id}`;
  };

  const handleResultClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    window.location.href = `/dashboard/quizzes/${quizData.id}/results`;
  };

  const handleOpenDeleteDialog = () => {
    setDropdownOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleDeleteQuiz = async () => {
    try {
      setSubmittingDelete(true);
      await fetchGraphQL(`
        mutation DeleteQuiz {
          deleteQuiz(id: "${quizData.id}")
        }
      `);

      onQuizDeleted?.();
      toast("Quiz deleted successfully.", {
        duration: 3000,
        icon: <Trash className="w-4 h-4" />,
      });
    } catch (error) {
      toast.error("Failed to delete quiz. Please try again later.");
    } finally {
      setSubmittingDelete(false);
      setDeleteDialogOpen(false);
    }
  };

  const onRegenerate = () => {
    setDropdownOpen(false);
    window.location.href = `/dashboard/quizzes/${quizData.id}/edit`;
  };

  return (
    <>
      <Link href={`/dashboard/quizzes/${quizData.id}`}>
        <Card
          className={cn(
            "flex h-full flex-col shadow-sm hover:shadow-md transition-all dark:border-gray-800 cursor-pointer relative group",
            needsAttention() ? "border-red-500" : "border-gray-200",
            needsAttention()
              ? "hover:border-red-500"
              : "hover:border-primary/50",
            className
          )}
        >
          {needsAttention() && (
            <div className="absolute top-2 right-2 z-10">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          )}

          <CardHeader className="pb-3 flex flex-row items-start justify-between">
            <div className="space-y-2">
              <Badge
                variant="secondary"
                className="text-xs w-fit flex items-center gap-1"
              >
                <button
                  onClick={handleMaterialClick}
                  className="flex items-center gap-1 text-xs hover:underline"
                >
                  <ExternalLink className="inline w-3 h-3" />
                  {quizData.material.title}
                </button>
              </Badge>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Created {formatDate(quizData.createdAt)}
              </div>
            </div>
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild className="dropdown-trigger">
                <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <MoreVertical size={18} className="text-gray-500" />
                  <span className="sr-only">Open menu</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onRegenerate}>
                  Regenerate
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleOpenDeleteDialog();
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>

          <CardContent className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="h-3 w-3 text-blue-500" />
                  <span className="text-xs font-medium">Attempts</span>
                </div>
                <p className="text-lg font-bold">{quizData.totalAttempts}</p>
              </div>

              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-purple-500" />
                  <span className="text-xs font-medium">Average</span>
                </div>
                <p className="text-lg font-bold">
                  {quizData.averagePercentage.toFixed(0)}%
                </p>
              </div>

              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs font-medium">Best score</span>
                </div>
                <p className="text-lg font-bold">{quizData.bestScore || 0}</p>
              </div>

              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-xs font-medium">Latest score</span>
                </div>
                <p className="text-lg font-bold">
                  {quizData.latestResult
                    ? `${quizData.latestResult.score}`
                    : "N/A"}
                </p>
              </div>
            </div>

            {quizData.latestResult && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground">
                      Last attempt:{" "}
                      {formatDate(quizData.latestResult.completedAt)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResultClick}
                  >
                    See results
                  </Button>
                </div>
              </div>
            )}

            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
                <span>Click to attempt</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {needsAttention() && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {quizData.totalAttempts === 0
                      ? "No attempts yet"
                      : quizData.averagePercentage < 60
                      ? "Low average score"
                      : "Needs practice"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
      <DeleteAssetDialog
        isOpen={deleteDialogOpen}
        setIsOpenAction={setDeleteDialogOpen}
        onDeleteAction={handleDeleteQuiz}
        submitting={submittingDelete}
        name="quiz"
      />
    </>
  );
}

export default QuizCard;

import React from "react";
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
} from "lucide-react";
import Link from "next/link";
import { QuizData } from "@/lib/definitions";
import { formatDate } from "@/utils/format-date";
import { Button } from "./ui/button";

function QuizCard({
  quizData,
  className,
}: {
  quizData: QuizData;
  className?: string;
}) {
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

  return (
    <Link href={`/dashboard/quizzes/${quizData.id}`}>
      <Card
        className={cn(
          "flex h-full flex-col shadow-sm hover:shadow-md transition-all dark:border-gray-800 cursor-pointer relative",
          needsAttention() ? "border-red-500" : "border-gray-200",
          needsAttention() ? "hover:border-red-500" : "hover:border-primary/50",
          className
        )}
      >
        {needsAttention() && (
          <div className="absolute top-2 right-2 z-10">
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
        )}

        <CardHeader className="pb-3">
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
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <p className="text-xs text-muted-foreground">
                Last attempt: {formatDate(quizData.latestResult.completedAt)}
              </p>
              <Button variant="outline" size="sm" onClick={handleResultClick}>
                See results
              </Button>
            </div>
          )}

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
  );
}

export default QuizCard;

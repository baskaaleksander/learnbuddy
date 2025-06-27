import { QuizResult } from "@/lib/definitions";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Clock, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

function QuizResultCard(props: QuizResult) {
  const percentageScore = (props.score / props.totalQuestions) * 100;
  const completedDate = new Date(props.completedAt).toLocaleDateString();

  const getScoreBadgeVariant = () => {
    if (percentageScore >= 80) return "default";
    if (percentageScore >= 60) return "secondary";
    return "destructive";
  };

  const getScoreLabel = () => {
    if (percentageScore >= 80) return "Excellent";
    if (percentageScore >= 60) return "Good";
    return "Needs Improvement";
  };

  return (
    <Link href={`/dashboard/quizzes/result/${props.id}`}>
      <Card className="hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer group relative">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {percentageScore >= 50 ? (
                <div className="bg-green-100 p-2.5 rounded-full flex items-center justify-center shrink-0">
                  <Check className="text-green-600 w-6 h-6" />
                </div>
              ) : (
                <div className="bg-red-100 p-2.5 rounded-full flex items-center justify-center shrink-0">
                  <X className="text-red-600 w-6 h-6" />
                </div>
              )}

              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground">
                    {props.score}/{props.totalQuestions}
                  </span>
                  <Badge
                    variant={getScoreBadgeVariant()}
                    className="text-xs px-2 py-0.5"
                  >
                    {percentageScore.toFixed(0)}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getScoreLabel()}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground shrink-0">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{completedDate}</span>
              </div>
              {props.totalQuestions && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{props.totalQuestions} questions</span>
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
              <span>View details</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default QuizResultCard;

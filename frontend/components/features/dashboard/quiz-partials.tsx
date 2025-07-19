import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { QuizPartialData } from "@/lib/definitions";
import { Calendar, ExternalLink, MessageCircleQuestion } from "lucide-react";
import Link from "next/link";
import React from "react";

function QuizPartials({
  quizPartialsData,
  totalQuizResults,
}: {
  quizPartialsData: QuizPartialData[];
  totalQuizResults: number;
}) {
  const quizPartialsCount = quizPartialsData.length;
  const handleQuizClick = (quizId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    window.location.href = `/dashboard/quizzes/${quizId}/`;
  };
  return (
    <Card className="p-4 w-full">
      <CardHeader>
        <h2 className="text-base md:text-lg lg:text-xl font-semibold">
          Quiz Partials
        </h2>
        <p className="text-sm text-muted-foreground">
          You have {quizPartialsCount} quiz partials saved, with a total of{" "}
          {totalQuizResults} quiz results.
        </p>
        {quizPartialsCount > 0 && (
          <div>
            <ul className="flex flex-col gap-3">
              {quizPartialsData.map((partial) => (
                <li key={partial.id}>
                  <Link
                    href={`/dashboard/quizzes/${partial.quizId}/take`}
                    className="flex items-center gap-4 rounded-lg px-3 py-2 hover:bg-muted transition"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <MessageCircleQuestion className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate text-base hover:underline">
                          Question {partial.currentQuestionIndex + 1}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-xs w-fit flex items-center gap-1"
                        >
                          <button
                            onClick={handleQuizClick(partial.quizId)}
                            className="flex items-center gap-1 text-xs hover:underline"
                          >
                            <ExternalLink className="inline w-3 h-3" />
                            Go to Quiz
                          </button>
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Updated: {""}
                          {new Date(partial.lastUpdated).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Click on a quiz partial to continue where you left off.
            </p>
          </div>
        )}
        {quizPartialsCount === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <Button
              className="mt-2"
              variant="default"
              onClick={() => (window.location.href = "/dashboard/quizzes/")}
            >
              Start New Quiz
            </Button>
            <p className="text-sm text-muted-foreground mt-3 max-w-xs">
              You have no quiz partials saved. Start a new quiz to create one.
            </p>
          </div>
        )}
      </CardHeader>
    </Card>
  );
}

export default QuizPartials;

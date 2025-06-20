"use client";
import React, { use, useEffect, useState } from "react";
import { fetchGraphQL } from "@/utils/gql-axios";
import { QuizQuestion } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Loader2,
  RotateCcw,
  Trophy,
} from "lucide-react";
import ErrorComponent from "@/components/error-component";
import LoadingScreen from "@/components/loading-screen";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.id;
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [materialTitle, setMaterialTitle] = useState("");
  const [quizResultLoading, setQuizResultLoading] = useState<boolean>(true);
  const [quizResult, setQuizResult] = useState<any>(null);

  useEffect(() => {
    const fetchQuizContent = async () => {
      try {
        setLoading(true);
        setError(null);
        const quizResponse = await fetchGraphQL(`
                    query GetQuizById {
                        getQuizById(id: "${quizId}") {
                            content
                            material {
                                title
                            }
                            partialData {
                                currentQuestionIndex
                                questionsAndAnswers {
                                question
                                answer
                                }
                            }
                        }
                    }
                `);

        if (quizResponse.getQuizById) {
          setQuiz(quizResponse.getQuizById.content);
          setMaterialTitle(quizResponse.getQuizById.material?.title || "");
          if (quizResponse.getQuizById.partialData) {
            const { currentQuestionIndex, questionsAndAnswers } =
              quizResponse.getQuizById.partialData;

            setCurrentQuestionIndex(currentQuestionIndex);
            const answers: Record<number, string> = {};
            questionsAndAnswers.forEach((qa: any, index: number) => {
              answers[index] = qa.answer;
            });
            setSelectedAnswers(answers);
          }
        } else {
          setError("Quiz not found");
        }
      } catch (error: any) {
        console.error("Error fetching quiz:", error);
        setError("Failed to load quiz. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizContent();
  }, [quizId]);

  useEffect(() => {
    if (!quizCompleted) return;

    const getQuizResult = async () => {
      try {
        const resultResponse = await fetchGraphQL(`
                    query GetQuizResultByQuizId {
                        getQuizResultByQuizId(id: "${quizId}") {
                            id
                            userId
                            materialId
                            aiOutputId
                            score
                            totalQuestions
                            completedAt
                            answers {
                                question
                                answer
                                isCorrect
                            }

                        }
                    }
                `);

        if (resultResponse.getQuizResultByQuizId) {
          setQuizResult(resultResponse.getQuizResultByQuizId);
        } else {
          setError("Failed to fetch quiz result.");
        }
      } catch (error: any) {
        console.error("Error fetching quiz result:", error);
        setError("Failed to fetch quiz result. Please try again later.");
      } finally {
        setQuizResultLoading(false);
      }
    };

    setTimeout(() => getQuizResult(), 1000);
  }, [quizCompleted, quizId]);

  const handleQuizReset = async () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setQuizCompleted(false);
    setSubmitting(false);
    setQuizResult(null);
    setQuizResultLoading(true);

    try {
      await fetchGraphQL(
        `mutation ResetQuizProgress {
            resetQuizProgress(quizId: "${quizId}")
          }`
      );
    } catch (error) {
      console.error("Error resetting quiz progress:", error);
      setError("Failed to reset quiz progress. Please try again.");
    }
  };

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answer,
    });
  };

  const handleNextQuestion = async () => {
    if (quiz && currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }

    const questionsAndAnswers = Object.entries(selectedAnswers).map(
      ([index, ans]) => ({
        question: parseInt(index) + 1,
        answer: ans,
      })
    );

    const answersCount = Object.entries(selectedAnswers).length;

    await fetchGraphQL(
      `mutation RegisterQuizProgress($quizId: String!, $currentQuestionIndex: Int!, $questionsAndAnswers: [QuestionAndAnswer!]!) {
          registerQuizProgress(
            quizId: $quizId,
            currentQuestionIndex: $currentQuestionIndex,
            questionsAndAnswers: $questionsAndAnswers
          )
        }`,
      {
        quizId: quizId,
        currentQuestionIndex:
          answersCount === quiz?.length
            ? currentQuestionIndex + 1
            : currentQuestionIndex,
        questionsAndAnswers:
          answersCount === quiz?.length
            ? questionsAndAnswers.slice(0, answersCount - 1)
            : questionsAndAnswers,
      }
    );
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    const questionsAndAnswers = Object.entries(selectedAnswers).map(
      ([index, ans]) => ({
        question: parseInt(index) + 1,
        answer: ans,
      })
    );
    setSubmitting(true);
    const res = await fetchGraphQL(
      `mutation RegisterQuizProgress($quizId: String!, $currentQuestionIndex: Int!, $questionsAndAnswers: [QuestionAndAnswer!]!) {
          registerQuizProgress(
            quizId: $quizId,
            currentQuestionIndex: $currentQuestionIndex,
            questionsAndAnswers: $questionsAndAnswers
          )
        }`,
      {
        quizId: quizId,
        currentQuestionIndex: currentQuestionIndex + 1,
        questionsAndAnswers: questionsAndAnswers,
      }
    );
    if (res.registerQuizProgress) {
      setQuizCompleted(true);
      setSubmitting(false);
    } else {
      setError("Failed to submit quiz. Please try again.");
    }
  };

  if (error) {
    return <ErrorComponent message={error} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!quiz || quiz.length === 0) {
    return <ErrorComponent message="No questions found for this quiz" />;
  }

  if (quizCompleted) {
    const totalQuestions = quiz.length;
    const percentage = quizResult?.score
      ? (quizResult.score / totalQuestions) * 100
      : 0;

    if (quizResultLoading || !quizResult) {
      return <LoadingScreen />;
    }

    return (
      <div className="p-4 max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div>
              <h1 className="text-2xl font-bold">Quiz Completed!</h1>
              <p className="text-muted-foreground">{materialTitle}</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {quizResult?.score || 0} / {totalQuestions}
              </div>
              <Badge
                variant={
                  percentage >= 70
                    ? "default"
                    : percentage >= 50
                    ? "secondary"
                    : "destructive"
                }
                className="text-sm px-3 py-1"
              >
                {percentage.toFixed(0)}%
              </Badge>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 space-y-2 bg-muted/20">
              <h3 className="font-medium">Performance Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Correct: {quizResult?.score || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CircleAlert className="w-4 h-4 text-red-500" />
                  <span>
                    Incorrect: {totalQuestions - (quizResult?.score || 0)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild>
              <Link href={`/dashboard/quizzes`}>Back to All Quizzes</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/quizzes/result/${quizResult?.id || ""}`}>
                Show details
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentQuestion = quiz[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.length - 1;
  const isAnswerSelected = selectedAnswers[currentQuestionIndex] !== undefined;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card className="shadow-md">
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              <h2 className="text-xl font-semibold">{materialTitle}</h2>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {quiz.length}
              </p>
            </div>
            <div className="flex flex-col justify-end items-end gap-1">
              <div className="flex items-center gap-1">
                {Array.from({ length: quiz.length }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentQuestionIndex
                        ? "bg-primary"
                        : selectedAnswers[index] !== undefined
                        ? "bg-primary"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">
              {currentQuestion.question}
            </h3>

            <div className="space-y-3">
              {Object.entries(currentQuestion.answers).map(([key, value]) => (
                <div
                  key={key}
                  onClick={() => handleSelectAnswer(value)}
                  className={`p-3 border border-gray-200 rounded-md cursor-pointer transition-colors ${
                    selectedAnswers[currentQuestionIndex] === value
                      ? "border-primary bg-primary/10"
                      : "hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:cursor-pointer"
                  onClick={handleQuizReset}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset Quiz Progress</TooltipContent>
            </Tooltip>
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          </div>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={!isAnswerSelected || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting
                </>
              ) : (
                "Submit Quiz"
              )}
            </Button>
          ) : (
            <Button onClick={handleNextQuestion} disabled={!isAnswerSelected}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default QuizPage;

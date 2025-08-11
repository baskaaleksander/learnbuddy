"use client";
import ErrorComponent from "@/components/common/error-component";
import LoadingScreen from "@/components/common/loading-screen";
import ResultQuestionCard from "@/components/features/quiz/result-question-card";
import { QuizResult } from "@/lib/definitions";
import { fetchGraphQL } from "@/utils/gql-axios";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React, { use, useEffect, useState } from "react";

function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const [results, setResults] = useState<QuizResult | null>(null);
  const [quiz, setQuiz] = useState<{
    id: string;
    content?: Array<{ question: string; answers: string[] }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const resultsResponse = await fetchGraphQL(`
          query GetQuizResultById {
            getQuizResultById(id: "${id}") {
                id
                userId
                materialId
                aiOutputId
                score
                totalQuestions
                correctAnswers
                completedAt
                answers {
                    question
                    answer
                    isCorrect
                }
            }
        }
    `);

        if (resultsResponse.getQuizResultById) {
          setResults(resultsResponse.getQuizResultById);

          const quizResponse = await fetchGraphQL(`
            query GetQuizById {
              getQuizById(id: "${resultsResponse.getQuizResultById.aiOutputId}") {
                  id
                  content
              }
          }
        `);

          if (quizResponse.getQuizById) {
            setQuiz(quizResponse.getQuizById);
          }
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

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorComponent message={error} />;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <Link
          href={`/dashboard/quizzes/${quiz?.id}`}
          className="text-blue-600 hover:underline flex items-center mb-4 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Quiz
        </Link>
        <h1 className="text-3xl font-bold mb-4">Quiz Results</h1>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-medium">Score</span>
            <span className="text-2xl font-bold">
              {results?.score} / {results?.totalQuestions}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Completed on{" "}
              {results?.completedAt
                ? new Date(results.completedAt).toLocaleDateString("en-US")
                : "N/A"}
            </span>
            <span className="text-sm text-gray-500">
              {results?.totalQuestions} questions
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {results?.answers.map(
          (
            question: { question: string; answer: string; isCorrect: boolean },
            index: number
          ) => (
            <ResultQuestionCard
              key={index}
              questionIndex={index}
              totalQuestions={results.totalQuestions}
              isCorrect={question.isCorrect}
              question={quiz?.content?.[index]?.question || question.question}
              answer={question.answer}
              answers={quiz?.content?.[index]?.answers || []}
              correctAnswer={results.correctAnswers[index]}
            />
          )
        )}
      </div>
    </div>
  );
}

export default ResultPage;

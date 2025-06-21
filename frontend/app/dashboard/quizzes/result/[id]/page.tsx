"use client";
import ErrorComponent from "@/components/error-component";
import LoadingScreen from "@/components/loading-screen";
import ResultQuestionCard from "@/components/result-question-card";
import { QuizResult } from "@/lib/definitions";
import { fetchGraphQL } from "@/utils/gql-axios";
import React, { use, useEffect, useState } from "react";

function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const [results, setResults] = useState<QuizResult | null>(null);
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
          query GetQuizResultByQuizId {
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

  return (
    <div className="flex flex-col justify-center p-4">
      <div>
        <h1 className="text-2xl font-bold mb-4">Quiz Result</h1>
        <p>
          Score: {results?.score} / {results?.totalQuestions}
        </p>
        <p>
          Completed At:{" "}
          {results?.completedAt
            ? new Date(results.completedAt).toLocaleDateString()
            : "N/A"}
        </p>
      </div>
      <div>
        <h2>Questions</h2>
        {results?.answers.map((question: any, index: number) => (
          <ResultQuestionCard
            key={index}
            questionIndex={index}
            totalQuestions={results.totalQuestions}
            isCorrect={question.isCorrect}
            question={question.question}
            answer={question.answer}
            correctAnswer={results.correctAnswers[index]}
          />
        ))}
      </div>
    </div>
  );
}

export default ResultPage;

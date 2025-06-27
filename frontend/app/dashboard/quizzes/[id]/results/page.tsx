"use client";
import ErrorComponent from "@/components/common/error-component";
import LoadingScreen from "@/components/common/loading-screen";
import QuizResultCard from "@/components/features/quiz/quiz-result-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginationProps, QuizResult } from "@/lib/definitions";
import { fetchGraphQL } from "@/utils/gql-axios";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import React, { use, useEffect, useState } from "react";

function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizResults, setQuizResults] = useState<PaginationProps<QuizResult>>();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>("completedAt-desc");
  const [totalPages, setTotalPages] = useState<number>(1);
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        setError(null);

        const quizzesResponse = await fetchGraphQL(`
            query GetQuizResultsByQuizId {
                getQuizResultsByQuizId(quizId: "${id}" page: ${page}, pageSize: ${pageSize}, sortBy: "${sortBy}") {
                    totalItems
                    totalPages
                    currentPage
                    pageSize
                    hasNextPage
                    hasPreviousPage
                    data {
                        id
                        userId
                        materialId
                        aiOutputId
                        score
                        totalQuestions
                        completedAt
                    }
                }
            }
        `);

        if (quizzesResponse.getQuizResultsByQuizId.data) {
          setQuizResults(quizzesResponse.getQuizResultsByQuizId);
          setTotalPages(quizzesResponse.getQuizResultsByQuizId.totalPages);
        } else {
          setError("Quiz results not found");
        }
      } catch (error) {
        console.error("Error fetching quiz results:", error);
        setError("Failed to fetch quiz results. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [page, pageSize, sortBy]);

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  if (error) {
    return <ErrorComponent message={error} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }
  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Quiz results ({quizResults?.data[0].aiOutputId})
        </h1>
        <p className="text-muted-foreground">
          {quizResults?.data?.length} result
          {quizResults?.data?.length !== 1 ? "s" : ""} found
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completedAt-desc">Newest First</SelectItem>
                  <SelectItem value="completedAt-asc">Oldest First</SelectItem>
                  <SelectItem value="score-asc">Score Low-High</SelectItem>
                  <SelectItem value="score-desc">Score High-Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground mr-2">
                Page Size:
              </span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => handlePageSizeChange(parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-[100px]">
                  <SelectValue placeholder="Page Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={!quizResults?.hasPreviousPage}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <span className="text-sm text-muted-foreground px-2">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!quizResults?.hasNextPage}
              className="flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {quizResults && quizResults.data.length > 0 ? (
          quizResults?.data?.map((quiz) => {
            return <QuizResultCard key={quiz.id} {...quiz} />;
          })
        ) : (
          <p>No results found</p>
        )}
      </div>
    </div>
  );
}

export default ResultsPage;

"use client";
import DeleteAssetDialog from "@/components/common/delete-asset-dialog";
import ErrorComponent from "@/components/common/error-component";
import { GenerateAssetDialog } from "@/components/common/generate-asset";
import LoadingScreen from "@/components/common/loading-screen";
import QuizResultCard from "@/components/features/quiz/quiz-result-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginationProps, QuizData, QuizResult } from "@/lib/definitions";
import { fetchGraphQL } from "@/utils/gql-axios";
import {
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Target,
  Trash,
  TrendingUp,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { use, useEffect, useState } from "react";
import { toast } from "sonner";

function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<QuizData | null>(null);
  const [quizResults, setQuizResults] = useState<PaginationProps<QuizResult>>();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [sortBy, setSortBy] = useState<string>("completedAt-desc");
  const [totalPages, setTotalPages] = useState<number>(1);
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [submittingRegenerate, setSubmittingRegenerate] =
    useState<boolean>(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] =
    useState<boolean>(false);
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        setError(null);

        const quizzesResponse = await fetchGraphQL(`
            query GetQuizInfoById {
              getQuizInfoById(id: "${id}") {
                  id
                  createdAt
                  averageScore
                  totalAttempts
                  averagePercentage
                  bestScore
                  createdAt
                  latestResult {
                    score
                    completedAt
                  }
                  material {
                    id
                    title
                    createdAt
                  }
              }
            }
          `);

        const quizResultsResponse = await fetchGraphQL(`
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

        if (quizResultsResponse.getQuizResultsByQuizId.data) {
          setQuizResults(quizResultsResponse.getQuizResultsByQuizId);
          setTotalPages(quizResultsResponse.getQuizResultsByQuizId.totalPages);
        } else {
          setError("Quiz results not found");
        }

        if (quizzesResponse.getQuizInfoById) {
          setQuizzes(quizzesResponse.getQuizInfoById);
        } else {
          setError("Quizzes not found");
        }
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        setError("Failed to fetch quizzes. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [id, page, pageSize, sortBy]);

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

  const handleMaterialClick = () => {
    if (quizzes?.material.id) {
      router.push(`/dashboard/materials/${quizzes.material.id}`);
    } else {
      toast.error("Material not found or not linked to this quiz.");
    }
  };

  const handleRegenerateQuiz = async () => {
    try {
      setSubmittingRegenerate(true);
      setError(null);
      await fetchGraphQL(`
                mutation RegenerateQuiz {
                  regenerateQuiz(materialId: "${quizzes?.material.id}" )
                }
              `);
      toast("Quiz regenerated successfully.", {
        icon: <RefreshCw className="h-4 w-4" />,
        duration: 3000,
      });
      router.push("/dashboard/quizzes/");
    } catch (error) {
      setError("Failed to regenerate quiz. Please try again later.");
      toast.error("Failed to regenerate quiz. Please try again later.");
    } finally {
      setSubmittingRegenerate(false);
      setRegenerateDialogOpen(false);
    }
  };

  const handleDeleteQuiz = async () => {
    try {
      setSubmittingDelete(true);
      await fetchGraphQL(`
        mutation DeleteQuiz {
            deleteQuiz(id: "${quizzes?.material.id}" )
        }
    `);
      toast("Quiz deleted successfully.", {
        duration: 3000,
        icon: <Trash className="h-4 w-4" />,
      });
      router.push("/dashboard/quizzes");
    } catch (error) {
      setError("Failed to delete quiz. Please try again later.");
      toast.error("Failed to delete quiz. Please try again later.");
    } finally {
      setSubmittingDelete(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorComponent message={error} />;
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <div className="flex flex-col md:flex-row items-center justify-between mb-4">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <h1 className="text-2xl font-bold">Quiz</h1>
            <Badge
              variant="secondary"
              className="text-xs w-fit flex items-center gap-1"
            >
              <button
                onClick={handleMaterialClick}
                className="flex items-center gap-1 text-xs hover:underline"
              >
                <ExternalLink className="inline w-3 h-3" />
                {quizzes?.material.title}
              </button>
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <GenerateAssetDialog
              isOpen={regenerateDialogOpen}
              setIsOpenAction={setRegenerateDialogOpen}
              assetData={{
                title: "Quiz",
                description: "Regenerate quiz for this material",
                cost: 2,
              }}
              onGenerateAction={handleRegenerateQuiz}
              submitting={submittingRegenerate}
              triggerText="Regenerate"
            />
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={submittingDelete}
            >
              {submittingDelete ? "Deleting..." : "Delete"}
            </Button>
            <DeleteAssetDialog
              isOpen={deleteDialogOpen}
              setIsOpenAction={setDeleteDialogOpen}
              name="quiz"
              onDeleteAction={handleDeleteQuiz}
              submitting={submittingDelete}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-3 w-3 text-blue-500" />
              <span className="text-xs font-medium">Attempts</span>
            </div>
            <p className="text-lg font-bold">{quizzes?.totalAttempts}</p>
          </div>

          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 text-purple-500" />
              <span className="text-xs font-medium">Average</span>
            </div>
            <p className="text-lg font-bold">
              {quizzes?.averagePercentage.toFixed(0)}%
            </p>
          </div>

          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="h-3 w-3 text-yellow-500" />
              <span className="text-xs font-medium">Best score</span>
            </div>
            <p className="text-lg font-bold">{quizzes?.bestScore || 0}</p>
          </div>

          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-xs font-medium">Latest score</span>
            </div>
            <p className="text-lg font-bold">
              {quizzes?.latestResult ? `${quizzes.latestResult.score}` : "N/A"}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-end">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Created:{" "}
            {quizzes?.createdAt
              ? new Date(quizzes.createdAt).toLocaleDateString()
              : "N/A"}
          </div>
          <Link href={`/dashboard/quizzes/${id}/take`}>
            <Button>Take quiz</Button>
          </Link>
        </CardFooter>
      </Card>
      <div>
        <h1 className="text-xl font-bold">Quiz results</h1>
        <p className="text-sm text-muted-foreground">
          {quizResults?.totalItems} result
          {quizResults?.totalItems !== 1 ? "s" : ""} found
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

export default QuizPage;

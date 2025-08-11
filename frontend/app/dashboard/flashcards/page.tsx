"use client";

import React, { useCallback, useEffect, useState } from "react";
import { fetchGraphQL } from "@/utils/gql-axios";
import { FlashcardData, PaginationProps } from "@/lib/definitions";
import FlashcardCard from "@/components/features/flashcards/flashcard-card";
import ErrorComponent from "@/components/common/error-component";
import LoadingScreen from "@/components/common/loading-screen";
import {
  ArrowRight,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function FlashcardsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcards, setFlashcards] =
    useState<PaginationProps<FlashcardData>>();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>("createdAt-desc");
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchFlashcards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const flashcardsResponse = await fetchGraphQL(`
				  query GetFlashcardsSetsByUser {
					  getFlashcardsSetsByUser(page: ${page}, pageSize: ${pageSize}, sortBy: "${sortBy}") {
						  totalItems
						  totalPages
						  currentPage
						  pageSize
						  hasNextPage
						  hasPreviousPage
						  data {
							  id
							  createdAt
							  total
							  known
							  review
							  lastUpdated
							  material {
								id
								title
							  }
						  }
					  }
				  }

      			`);

      if (flashcardsResponse.getFlashcardsSetsByUser) {
        setFlashcards(flashcardsResponse.getFlashcardsSetsByUser);
        setTotalPages(flashcardsResponse.getFlashcardsSetsByUser.totalPages);
      }
    } catch {
      setError("Failed to fetch flashcards. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy]);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

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

  const handleFlashcardsDeleted = () => {
    setPage(1);
    fetchFlashcards();
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
        <h1 className="text-2xl font-bold">Flashcards</h1>
        <p className="text-muted-foreground">
          {flashcards?.data?.length} flashcards
          {flashcards?.data?.length !== 1 ? `'` : ""} found
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center w-full">
          <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="title-asc">Title A-Z</SelectItem>
                  <SelectItem value="title-desc">Title Z-A</SelectItem>
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
              disabled={!flashcards?.hasPreviousPage}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <span className="text-sm text-muted-foreground px-2 whitespace-nowrap">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!flashcards?.hasNextPage}
              className="flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {flashcards && flashcards.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {flashcards?.data?.map((flashcard) => {
            return (
              <FlashcardCard
                key={flashcard.id}
                flashcardData={flashcard}
                onFlashcardDeleted={handleFlashcardsDeleted}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="relative mb-4">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
              <Zap className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs text-primary font-medium">AI</span>
            </div>
          </div>
          <h3 className="font-medium text-foreground mb-2">
            No flashcards yet
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Upload some learning materials and generate flashcards to see them
            here.
          </p>
          <Link
            href="/dashboard/materials"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Browse your materials
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default FlashcardsPage;

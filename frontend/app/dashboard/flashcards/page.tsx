"use client";

import React, { useEffect, useState } from "react";
import { fetchGraphQL } from "@/utils/gql-axios";
import { FlashcardData, PaginationProps } from "@/lib/definitions";
import FlashcardCard from "@/components/flashcard-card";
import ErrorComponent from "@/components/error-component";
import LoadingScreen from "@/components/loading-screen";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

function FlashcardsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcards, setFlashcards] =
    useState<PaginationProps<FlashcardData>>();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>("createdAt-desc");
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    const fetchFlashcards = async () => {
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
      } catch (error) {
        setError("Failed to fetch flashcards. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchFlashcards();
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

            <span className="text-sm text-muted-foreground px-2">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {flashcards && flashcards.data.length > 0 ? (
          flashcards?.data?.map((flashcard) => {
            return (
              <FlashcardCard key={flashcard.id} flashcardData={flashcard} />
            );
          })
        ) : (
          <p>No flashcards found</p>
        )}
      </div>
    </div>
  );
}

export default FlashcardsPage;

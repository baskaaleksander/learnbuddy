"use client";
import ErrorComponent from "@/components/error-component";
import FlashcardQuestionCard from "@/components/flashcard-question-card";
import LoadingScreen from "@/components/loading-screen";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { fetchGraphQL } from "@/utils/gql-axios";
import { Calendar, Check, ReceiptText, X } from "lucide-react";
import Link from "next/link";
import React, { use, useEffect, useState } from "react";
import { toast } from "sonner";

function FlashcardsSetPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const [flashcardsSet, setFlashcardsSet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashcardsStats, setFlashcardsStats] = useState<any>(null);

  const fetchFlashcardsSet = async () => {
    try {
      const flashcardsResponse = await fetchGraphQL(`
            query GetFlashcardsById {
                getFlashcardsById(id: "${id}") {
                    total
                    known
                    review
                    lastUpdated
                    data {
                        flashcardId
                        question
                        answer
                        status
                        statusUpdatedAt
                    }
                }
            }
        `);

      if (flashcardsResponse.getFlashcardsById) {
        setFlashcardsSet(flashcardsResponse.getFlashcardsById.data);
        setFlashcardsStats({
          total: flashcardsResponse.getFlashcardsById.total,
          known: flashcardsResponse.getFlashcardsById.known,
          review: flashcardsResponse.getFlashcardsById.review,
          lastUpdated: flashcardsResponse.getFlashcardsById.lastUpdated,
        });
      } else {
        setError("Flashcards set not found");
      }
    } catch (error) {
      console.error("Error fetching flashcards set:", error);
      setError("Failed to fetch flashcards set. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcardsSet();
  }, [id]);

  const knowledgeRate = flashcardsStats
    ? ((flashcardsStats.known / flashcardsStats.total) * 100).toFixed(0)
    : 0;

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorComponent message={error} />;
  }

  const onProgressUpdated = async (flashcardId: string, status: string) => {
    try {
      await fetchGraphQL(`
        mutation UpdateFlashcardProgress {
          updateFlashcardProgress(id: "${flashcardId}", status: "${status}") 
      }
    `);
    } catch (error) {
      console.error("Error updating flashcard progress:", error);
      toast.error(
        "Failed to update flashcard progress. Please try again later."
      );
    }
    fetchFlashcardsSet();
  };

  const restartProgress = async () => {};
  return (
    <div className="p-4 space-y-6">
      {flashcardsSet && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold mb-4">Flashcards Set</h1>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                Regenerate
              </Button>
              <Button size="sm" variant="destructive">
                Delete
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium">Known</span>
                </div>
                <p className="text-lg font-bold">{flashcardsStats.known}</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-medium">Review</span>
                </div>
                <p className="text-lg font-bold">{flashcardsStats.review}</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ReceiptText className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium">Total</span>
                </div>
                <p className="text-lg font-bold">{flashcardsStats.total}</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-xs font-medium">Knowledge rate</span>
                </div>
                <p className="text-lg font-bold">{knowledgeRate}%</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-end">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Last update:{" "}
                {new Date(flashcardsStats.lastUpdated).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={restartProgress}>
                  Restart progress
                </Button>
                <Link href={`/dashboard/flashcards/${id}/play`}>
                  <Button>Play</Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
          <div className="mt-6 flex flex-col gap-4">
            {flashcardsSet.map((flashcard: any) => (
              <FlashcardQuestionCard
                key={flashcard.flashcardId}
                flashcardQuestionData={{
                  flashcardId: flashcard.flashcardId,
                  question: flashcard.question,
                  answer: flashcard.answer,
                  status: flashcard.status,
                  statusUpdatedAt: new Date(flashcard.statusUpdatedAt),
                }}
                onProgressUpdated={onProgressUpdated}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FlashcardsSetPage;

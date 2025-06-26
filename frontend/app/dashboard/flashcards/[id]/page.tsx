"use client";
import ErrorComponent from "@/components/error-component";
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
import React, { use, useEffect, useState } from "react";

function FlashcardsSetPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const [flashcardsSet, setFlashcardsSet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashcardsStats, setFlashcardsStats] = useState<any>(null);

  useEffect(() => {
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

  return (
    <div>
      {flashcardsSet && (
        <div>
          <h1 className="text-2xl font-bold mb-4">Flashcards Set</h1>
          <Card className="">
            {/* <CardHeader>
              <h2 className="text-xl font-semibold">Stats</h2>
            </CardHeader> */}
            <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium">Known</span>
                </div>
                <p className={"text-lg font-bold"}>{flashcardsStats.known}</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-medium">Review</span>
                </div>
                <p className={"text-lg font-bold"}>{flashcardsStats.review}</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ReceiptText className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium">Total</span>
                </div>
                <p className={"text-lg font-bold"}>{flashcardsStats.total}</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-xs font-medium">Knowledge rate</span>
                </div>
                <p className={"text-lg font-bold"}>{knowledgeRate}%</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Last update:{" "}
                {new Date(flashcardsStats.lastUpdated).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">Restart progress</Button>
                <Button>Play</Button>
              </div>
            </CardFooter>
          </Card>
          <ul className="space-y-4">
            {flashcardsSet.map((flashcard: any) => (
              <li key={flashcard.flashcardId} className="border p-4 rounded">
                <h3 className="font-semibold">{flashcard.question}</h3>
                <p>{flashcard.answer}</p>
                <p>Status: {flashcard.status}</p>
                <p>
                  Status Updated At:{" "}
                  {new Date(flashcard.statusUpdatedAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FlashcardsSetPage;

"use client";
import ErrorComponent from "@/components/common/error-component";
import LoadingScreen from "@/components/common/loading-screen";
import { Button } from "@/components/ui/button";
import { Flashcard } from "@/lib/definitions";
import { fetchGraphQL } from "@/utils/gql-axios";
import { Check, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import React, { use, useEffect, useState } from "react";
import { toast } from "sonner";

function FlashcardsPlayPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashcardsSet, setFlashcardsSet] = useState<Array<Flashcard>>(null);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleFlashcardStatusKnown = async (flashcardId: string) => {
    try {
      await fetchGraphQL(`
        mutation UpdateFlashcardProgress {
          updateFlashcardProgress(id: "${flashcardId}", status: "known") 
      }
    `);
      toast.success("Flashcard marked as known!");
    } catch (error) {
      console.error("Error updating flashcard progress:", error);
      toast.error(
        "Failed to update flashcard progress. Please try again later."
      );
    } finally {
      nextFlashcard();
    }
  };

  const nextFlashcard = () => {
    setCurrentFlashcardIndex((prevIndex) => prevIndex + 1);
    setIsFlipped(false);
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  useEffect(() => {
    const fetchFlashcardsSet = async () => {
      try {
        setLoading(true);
        setError(null);
        const flashcardsResponse = await fetchGraphQL(`
                query GetFlashcardsById {
                    getFlashcardsById(id: "${id}", status: "review") {
                        data {
                            flashcardId
                            question
                            answer
                            status
                        }
                    }
                }
            `);

        if (flashcardsResponse.getFlashcardsById.data) {
          setFlashcardsSet(flashcardsResponse.getFlashcardsById.data);
          if (flashcardsResponse.getFlashcardsById.data.length === 0) {
            setFinished(true);
          }
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

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorComponent message={error} />;
  }

  if (currentFlashcardIndex >= flashcardsSet.length || finished) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Congratulations!
          </h2>
          <p className="text-gray-600">
            You&apos;ve completed all flashcards in this set.
          </p>
          <Link href={`/dashboard/flashcards/${id}`}>
            <Button className="mt-4">Back to Flashcards Set</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentFlashcard = flashcardsSet[currentFlashcardIndex];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link href={`/dashboard/flashcards/${id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Flashcards
              </Button>
            </Link>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Card {currentFlashcardIndex + 1} of {flashcardsSet.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ((currentFlashcardIndex + 1) / flashcardsSet.length) * 100
                }%`,
              }}
            ></div>
          </div>
        </div>

        <div className="relative perspective-1000 mb-8">
          <div
            className={`relative w-full h-80 cursor-pointer transition-transform duration-600 transform-style-preserve-3d ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            onClick={flipCard}
          >
            <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center p-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Question
                </h3>
                <p className="text-lg text-gray-700">
                  {currentFlashcard.question}
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  Click to reveal answer
                </p>
              </div>
            </div>

            <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-primary/5 rounded-xl shadow-lg border border-primary/20 flex items-center justify-center p-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-primary/90 mb-4">
                  Answer
                </h3>
                <p className="text-lg text-primary/80">
                  {currentFlashcard.answer}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Button
            variant="ghost"
            onClick={nextFlashcard}
            className="flex items-center justify-center w-16 h-16 border border-red-500 hover:border-red-600 text-red-500 hover:text-red-600 rounded-full shadow-lg transition-colors duration-200"
            title="Don't know this"
          >
            <X className="w-8 h-8" />
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              handleFlashcardStatusKnown(currentFlashcard.flashcardId)
            }
            className="flex items-center justify-center w-16 h-16 border border-green-500 hover:border-green-600 text-green-500 hover:text-green-600 rounded-full shadow-lg transition-colors duration-200"
            title="I know this"
          >
            <Check className="w-8 h-8" />
          </Button>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}

export default FlashcardsPlayPage;

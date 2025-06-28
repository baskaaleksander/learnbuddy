"use client";
import DeleteAssetDialog from "@/components/common/delete-asset-dialog";
import ErrorComponent from "@/components/common/error-component";
import FlashcardQuestionCard from "@/components/features/flashcards/flashcard-question-card";
import { GenerateAssetDialog } from "@/components/common/generate-asset";
import LoadingScreen from "@/components/common/loading-screen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { MaterialData } from "@/lib/definitions";
import { fetchGraphQL } from "@/utils/gql-axios";
import {
  Calendar,
  Check,
  ExternalLink,
  ReceiptText,
  RefreshCw,
  Trash,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { use, useEffect, useState } from "react";
import { toast } from "sonner";

function FlashcardsSetPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const [flashcardsSet, setFlashcardsSet] = useState<any>(null);
  const [material, setMaterial] = useState<Partial<MaterialData> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [flashcardsStats, setFlashcardsStats] = useState<any>(null);
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [submittingRegenerate, setSubmittingRegenerate] =
    useState<boolean>(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] =
    useState<boolean>(false);
  const router = useRouter();

  const fetchFlashcardsSet = async () => {
    try {
      const flashcardsResponse = await fetchGraphQL(`
            query GetFlashcardsById {
                getFlashcardsById(id: "${id}") {
                    total
                    known
                    review
                    lastUpdated
                    material {
                        id
                        title
                        }
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
        setMaterial(flashcardsResponse.getFlashcardsById.material);
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

  const handleMaterialClick = () => {
    if (material && material.id) {
      router.push(`/dashboard/materials/${material.id}`);
    } else {
      toast.error("Material not found or not linked to this flashcard set.");
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

  const restartProgress = async () => {
    try {
      await fetchGraphQL(`
        mutation ResetFlashcardProgress {
            resetFlashcardProgress(id: "${id}" )
        }
      `);
      fetchFlashcardsSet();
    } catch (error) {
      console.error("Error restarting flashcards progress:", error);
      toast.error(
        "Failed to restart flashcards progress. Please try again later."
      );
    }
  };

  const handleDeleteFlashcards = async () => {
    try {
      setSubmittingDelete(true);
      await fetchGraphQL(`
        mutation DeleteFlashcard {
            deleteFlashcard(id: "${id}")
        }
    `);
      toast("Flashcards deleted successfully.", {
        duration: 3000,
        icon: <Trash className="h-4 w-4" />,
      });
      router.push("/dashboard/flashcards");
    } catch (error) {
      setError("Failed to delete flashcards. Please try again later.");
      toast.error("Failed to delete flashcards. Please try again later.");
    } finally {
      setSubmittingDelete(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleRegenerateFlashcards = async () => {
    try {
      setSubmittingRegenerate(true);
      setError(null);
      await fetchGraphQL(`
                mutation RegenerateFlashcards {
                  regenerateFlashcards(materialId: "${material?.id}" )
                }
              `);
      toast("Flashcards regenerated successfully.", {
        icon: <RefreshCw className="h-4 w-4" />,
        duration: 3000,
      });
      router.push("/dashboard/flashcards/");
    } catch (error) {
      setError("Failed to regenerate flashcards. Please try again later.");
      toast.error("Failed to regenerate flashcards. Please try again later.");
    } finally {
      setSubmittingRegenerate(false);
      setRegenerateDialogOpen(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {flashcardsSet && (
        <div>
          <div className="flex flex-col md:flex-row items-center justify-between mb-4">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <h1 className="text-2xl font-bold">Flashcards Set</h1>
              {material && (
                <Badge
                  variant="secondary"
                  className="text-xs w-fit flex items-center gap-1"
                >
                  <button
                    onClick={handleMaterialClick}
                    className="flex items-center gap-1 text-xs hover:underline"
                  >
                    <ExternalLink className="inline w-3 h-3" />
                    {material.title}
                  </button>
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <GenerateAssetDialog
                isOpen={regenerateDialogOpen}
                setIsOpenAction={setRegenerateDialogOpen}
                assetData={{
                  title: "Flashcards set",
                  description: "Regenerate flashcards for this set",
                  cost: 2,
                }}
                onGenerateAction={handleRegenerateFlashcards}
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
                name="flashcards set"
                onDeleteAction={handleDeleteFlashcards}
                submitting={submittingDelete}
              />
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
                <Link href={`/dashboard/flashcards/${id}/revise`}>
                  <Button>Revise</Button>
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

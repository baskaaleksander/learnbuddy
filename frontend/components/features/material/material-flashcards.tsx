import { fetchGraphQL } from "@/utils/gql-axios";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "../../ui/card";
import { cn } from "@/lib/utils";
import {
  Check,
  Play,
  ReceiptText,
  RefreshCw,
  Target,
  Trash,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import Link from "next/link";
import { GenerateAssetDialog } from "@/components/common/generate-asset";
import DeleteAssetDialog from "@/components/common/delete-asset-dialog";
import { toast } from "sonner";

//TODO: add here aioutputid for correct link
function MaterialFlashcards({
  id,
  className,
  onAssetChange,
}: {
  id: string;
  className?: string;
  onAssetChange: () => void;
}) {
  const [flashcardsStats, setFlashcardsStats] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState<boolean>(false);
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const [submittingGenerate, setSubmittingGenerate] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [submittingRegenerate, setSubmittingRegenerate] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] =
    useState<boolean>(false);
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchGraphQL(`
                  query GetFlashcardStatsByMaterial {
                      getFlashcardStatsByMaterial(materialId: "${id}") {
                          aiOutputId
                          total
                          known
                          review
                          lastUpdated
                      }
                  }                
                `);
        const knowledgePercentage =
          (response.getFlashcardStatsByMaterial?.known /
            response.getFlashcardStatsByMaterial?.total) *
            100 || 0;
        if (response.getFlashcardStatsByMaterial.total !== 0) {
          setFlashcardsStats({
            ...response.getFlashcardStatsByMaterial,
            knowledgePercentage,
          });
        }
      } catch (error) {
        setError("Failed to fetch quizzes. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [id]);

  const assetData = {
    title: "Flashcards",
    description: "Generate flashcards for this material",
    cost: 2,
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
      onAssetChange();
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
                  regenerateFlashcards(materialId: "${id}")
                }
              `);
      toast("Flashcards regenerated successfully.", {
        icon: <RefreshCw className="h-4 w-4" />,
        duration: 3000,
      });
      onAssetChange();
    } catch (error) {
      setError("Failed to regenerate summary. Please try again later.");
      toast.error("Failed to regenerate flashcards. Please try again later.");
    } finally {
      setSubmittingRegenerate(false);
      setRegenerateDialogOpen(false);
    }
  };

  const handleGenerateDialog = async () => {
    try {
      setSubmittingGenerate(true);
      setError(null);
      await fetchGraphQL(`
        mutation CreateFlashcard {
            createFlashcard(materialId: "${id}")
        }
    `);
      toast("Flashcards generated successfully.", {
        icon: <Check className="h-4 w-4" />,
        duration: 3000,
      });
      setGenerateDialogOpen(false);
      onAssetChange();
    } catch (error) {
      setError("Failed to delete material. Please try again later.");
      toast.error("Failed to generate flashcards. Please try again later.");
    } finally {
      setSubmittingGenerate(false);
      setGenerateDialogOpen(false);
    }
  };

  return (
    <Card
      className={cn(
        "flex h-full flex-col shadow-sm border-gray-200 dark:border-gray-800",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-semibold">Flashcards</h2>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">
              Loading...
            </span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center flex-1">
            <p className="text-sm text-destructive text-center">{error}</p>
          </div>
        ) : !flashcardsStats ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="mb-4">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                No flashcards available for this material.
              </p>
            </div>
            {/*<Button variant='outline' size="sm">*/}
            {/*    Generate flashcards*/}
            {/*</Button>*/}
            <GenerateAssetDialog
              isOpen={generateDialogOpen}
              setIsOpenAction={setGenerateDialogOpen}
              assetData={assetData}
              onGenerateAction={handleGenerateDialog}
              submitting={submittingGenerate}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-xl font-bold">
                    {flashcardsStats.known}
                  </div>
                  <div className="text-xs text-muted-foreground">Known</div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <X className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="text-xl font-bold">
                    {flashcardsStats.review}
                  </div>
                  <div className="text-xs text-muted-foreground">To review</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <ReceiptText className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-lg font-semibold">
                    {flashcardsStats.total}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total count
                  </div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center justify-center mb-2">
                    <Badge
                      variant={
                        flashcardsStats.knowledgePercentage >= 80
                          ? "default"
                          : flashcardsStats.knowledgePercentage >= 60
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-xs px-2 py-1"
                    >
                      {flashcardsStats.knowledgePercentage.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Knowledge rate
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-2">
              <Button asChild className="w-full" size="sm">
                <Link
                  href={`/dashboard/flashcards/${flashcardsStats.aiOutputId}/play`}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Revise
                </Link>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <GenerateAssetDialog
                  isOpen={regenerateDialogOpen}
                  setIsOpenAction={setRegenerateDialogOpen}
                  assetData={assetData}
                  onGenerateAction={handleRegenerateFlashcards}
                  submitting={submittingRegenerate}
                  triggerText="Regenerate"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete
                </Button>
                <DeleteAssetDialog
                  isOpen={deleteDialogOpen}
                  setIsOpenAction={setDeleteDialogOpen}
                  onDeleteAction={handleDeleteFlashcards}
                  submitting={submittingDelete}
                  name="Flashcards"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MaterialFlashcards;

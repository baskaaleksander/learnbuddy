import React, { useState } from "react";
import { FlashcardData } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  ExternalLink,
  MoreVertical,
  ReceiptText,
  Trash,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import DeleteAssetDialog from "../../common/delete-asset-dialog";
import { fetchGraphQL } from "@/utils/gql-axios";
import { toast } from "sonner";

function FlashcardCard({
  flashcardData,
  className,
  onFlashcardDeleted,
}: {
  flashcardData: FlashcardData;
  className?: string;
  onFlashcardDeleted?: () => void;
}) {
  const knowledgePercentage = (flashcardData.known / flashcardData.total) * 100;

  const needAttention = knowledgePercentage < 60;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false);
  const handleMaterialClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    window.location.href = `/dashboard/materials/${flashcardData.material.id}`;
  };
  const handleOpenDeleteDialog = () => {
    setDropdownOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleDeleteFlashcards = async () => {
    try {
      setSubmittingDelete(true);
      await fetchGraphQL(`
        mutation DeleteFlashcard {
          deleteFlashcard(id: "${flashcardData.id}")
        }
      `);
      toast("Flashcards deleted successfully.", {
        duration: 3000,
        icon: <Trash className="h-4 w-4" />,
      });

      onFlashcardDeleted?.();
    } catch (error) {
      toast.error("Failed to delete flashcards. Please try again later.");
    } finally {
      setSubmittingDelete(false);
      setDeleteDialogOpen(false);
    }
  };

  const onRegenerate = () => {
    setDropdownOpen(false);
    window.location.href = `/dashboard/quizzes/${flashcardData.id}/edit`;
  };
  return (
    <>
      <Link href={`/dashboard/flashcards/${flashcardData.id}`}>
        <Card
          className={cn(
            "flex h-full flex-col shadow-sm hover:shadow-md transition-all dark:border-gray-800 cursor-pointer relative group",
            needAttention ? "border-red-500" : "border-gray-200",
            needAttention ? "hover:border-red-500" : "hover:border-primary/50",
            className
          )}
        >
          {needAttention && (
            <div className="absolute top-2 right-2 z-10">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          )}

          <CardHeader className="pb-3 flex flex-row items-start justify-between">
            <div className="space-y-2">
              <Badge
                variant="secondary"
                className="text-xs w-fit flex items-center gap-1"
              >
                <button
                  onClick={handleMaterialClick}
                  className="flex items-center gap-1 text-xs hover:underline"
                >
                  <ExternalLink className="inline w-3 h-3" />
                  {flashcardData.material.title}
                </button>
              </Badge>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Created {formatDate(flashcardData.createdAt)}
              </div>
            </div>
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild className="dropdown-trigger">
                <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <MoreVertical size={18} className="text-gray-500" />
                  <span className="sr-only">Open menu</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onRegenerate}>Edit</DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleOpenDeleteDialog();
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>

          <CardContent className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium">Known</span>
                </div>
                <p className="text-lg font-bold">{flashcardData.known}</p>
              </div>

              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-medium">Review</span>
                </div>
                <p className="text-lg font-bold">{flashcardData.review}</p>
              </div>

              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ReceiptText className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium">Total</span>
                </div>
                <p className="text-lg font-bold">{flashcardData.total}</p>
              </div>

              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-xs font-medium">Knowledge rate</span>
                </div>
                <p className="text-lg font-bold">
                  {knowledgePercentage.toFixed(0)}%
                </p>
              </div>
            </div>

            {needAttention && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Needs attention
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
              <span>Click to view</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </Card>
      </Link>
      <DeleteAssetDialog
        isOpen={deleteDialogOpen}
        setIsOpenAction={setDeleteDialogOpen}
        onDeleteAction={handleDeleteFlashcards}
        submitting={submittingDelete}
        name="flashcard set"
      />
    </>
  );
}

export default FlashcardCard;

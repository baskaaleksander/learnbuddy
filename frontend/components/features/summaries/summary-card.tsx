"use client";
import React, { useState } from "react";
import { SummaryData } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Album,
  ArrowRight,
  Calendar,
  ExternalLink,
  List,
  MoreVertical,
  Trash,
} from "lucide-react";
import { formatDate } from "@/utils/format-date";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

import DeleteAssetDialog from "@/components/common/delete-asset-dialog";
import { fetchGraphQL } from "@/utils/gql-axios";
import { toast } from "sonner";

function SummaryCard({
  summaryData,
  className,
  onSummaryDelete,
}: {
  summaryData: SummaryData;
  className?: string;
  onSummaryDelete?: () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false);
  const handleMaterialClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    window.location.href = `/dashboard/materials/${summaryData.material.id}`;
  };
  const handleOpenDeleteDialog = () => {
    setDropdownOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSummary = async () => {
    try {
      setSubmittingDelete(true);
      await fetchGraphQL(`
			mutation DeleteSummary {
			  deleteSummary(id: "${summaryData.id}")
			}
		  `);
      toast("Summary deleted successfully", {
        icon: <Trash className="h-4 w-4" />,
        duration: 3000,
      });
      onSummaryDelete?.();
    } catch (error) {
      toast.error("Failed to delete summary. Please try again later.");
    } finally {
      setSubmittingDelete(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Link href={`/dashboard/summaries/${summaryData.id}`}>
        <Card
          className={cn(
            "flex h-full flex-col shadow-sm hover:shadow-md hover:border-primary/50 transition-all dark:border-gray-800 cursor-pointer relative group",
            className
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-primary">
                {summaryData.title}
              </h3>
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild className="dropdown-trigger">
                  <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <MoreVertical size={18} className="text-gray-500" />
                    <span className="sr-only">Open menu</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
            </div>
            <div className="space-y-2">
              <Badge
                variant="secondary"
                className="text-xs w-fit flex items-center gap-1"
              >
                <button
                  className="flex items-center gap-1 text-xs hover:underline hover:cursor-pointer"
                  onClick={handleMaterialClick}
                >
                  <ExternalLink className="inline w-3 h-3" />
                  {summaryData.material.title}
                </button>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center justify-center p-2 bg-muted/50 rounded-lg">
                <div className="flex flex-col items-center justify-center gap-1 mb-1">
                  <Album className="h-3 w-3" />
                  <span className="text-xs font-medium">Chapters count</span>
                </div>
                <p className="text-lg font-bold">{summaryData.chaptersCount}</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="flex flex-col items-center justify-center gap-1 mb-1">
                  <List className="h-3 w-3" />
                  <span className="text-xs font-medium">
                    Bullet points count
                  </span>
                </div>
                <p className="text-lg font-bold">
                  {summaryData.bulletPointsCount}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Created {formatDate(summaryData.createdAt)}
            </div>
          </CardFooter>

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
        onDeleteAction={handleDeleteSummary}
        submitting={submittingDelete}
        name="summary"
      />
    </>
  );
}

export default SummaryCard;

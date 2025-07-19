import React, { useState } from "react";
import { Calendar, File, MoreVertical, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "../../ui/card";
import Link from "next/link";
import { Badge } from "../../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import DeleteAssetDialog from "@/components/common/delete-asset-dialog";
import { useRouter } from "next/navigation";

interface MaterialCardProps {
  title: string;
  status: "PROCESSED" | "FAILED" | "PENDING";
  id: string;
  description?: string;
  createdAt: string;
  className?: string;
  onDelete?: () => void;
}

function MaterialCard({
  title,
  status,
  id,
  className,
  description,
  createdAt,
}: MaterialCardProps) {
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const router = useRouter();

  const handleDeleteMaterial = async () => {
    setDeleteDialogOpen(false);
  };

  const handleOpenDeleteDialog = () => {
    setDropdownOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleNavigate = () => {
    router.push(
      status === "PENDING"
        ? `/dashboard/materials/upload/${id}`
        : `/dashboard/materials/${id}`
    );
  };

  const onEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/materials/${id}/edit`);
  };

  return (
    <>
      <Link
        href={
          status === "PENDING"
            ? `/dashboard/materials/upload/${id}`
            : `/dashboard/materials/${id}`
        }
      >
        <Card
          className={cn(
            "flex h-full flex-col shadow-sm hover:shadow-md transition-all hover:border-primary/50 border-gray-200 dark:border-gray-800 group",
            status !== "PROCESSED" &&
              "border-red-500 bg-red-50 dark:bg-red-950/20 hover:border-red-400",
            className
          )}
        >
          <CardHeader className="pb-2 flex flex-row items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <File size={20} />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <h3 className="font-medium text-base line-clamp-2">{title}</h3>
                <p className="text-sm md:text-base text-gray-400">
                  {description}
                </p>
                {status !== "PROCESSED" && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {status === "PENDING"
                      ? "Processing..."
                      : "Processing failed"}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger
                asChild
                className="dropdown-trigger shrink-0 ml-2"
              >
                <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <MoreVertical size={18} className="text-gray-500" />
                  <span className="sr-only">Open menu</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => onEdit(e)}
                  className="text-sm"
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive text-sm"
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

          <CardContent className="py-2 mt-auto flex items-end justify-between">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created{" "}
                {new Date(createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <button
              onClick={handleNavigate}
              className="flex items-center gap-1 text-xs text-muted-foreground mt-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              {status !== "PROCESSED" ? "Review" : "View material"}
              <ArrowRight size={16} />
            </button>
          </CardContent>
        </Card>
      </Link>
      <DeleteAssetDialog
        isOpen={deleteDialogOpen}
        setIsOpenAction={setDeleteDialogOpen}
        onDeleteAction={handleDeleteMaterial}
        submitting={submittingDelete}
        name={title}
      />
    </>
  );
}

export default MaterialCard;

import React from "react";
import { Calendar, File, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "./ui/card";
import Link from "next/link";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface MaterialCardProps {
  title: string;
  status: "PROCESSED" | "FAILED" | "PENDING";
  id: string;
  description?: string;
  className?: string;
  onDelete?: () => void;
  onEdit?: () => void;
}

function MaterialCard({
  title,
  status,
  id,
  className,
  description,
  onDelete,
  onEdit,
}: MaterialCardProps) {
  const statusLower = status.toLowerCase();

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as Element).closest(".dropdown-trigger")) {
      e.preventDefault();
    }
  };

  return (
    <Link
      href={
        status == "PENDING"
          ? `/dashboard/materials/upload/${id}`
          : `/dashboard/materials/${id}`
      }
      onClick={handleCardClick}
    >
      <Card
        className={cn(
          "flex h-full flex-col shadow-sm hover:shadow-md transition-all hover:border-primary/50 border-gray-200 dark:border-gray-800 cursor-pointer",
          className
        )}
      >
        <CardHeader className="pb-2 flex flex-row items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <File size={20} />
            </div>
            <div className="flex flex-col flex-1">
              <h3 className="font-medium text-base line-clamp-2">{title}</h3>
              <p className="text-sm md:text-base text-gray-400">
                {description}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild className="dropdown-trigger">
              <button
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical size={18} className="text-gray-500" />
                <span className="sr-only">Open menu</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="py-2 mt-auto flex items-center justify-between">
          <Badge
            variant={
              statusLower === "processed"
                ? "outline"
                : statusLower === "in-progress"
                ? "secondary"
                : statusLower === "completed"
                ? "default"
                : "outline"
            }
          >
            {status}
          </Badge>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Created{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

export default MaterialCard;

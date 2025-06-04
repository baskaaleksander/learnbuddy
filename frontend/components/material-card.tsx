import React from 'react'
import { File, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Card, 
  CardContent, 
  CardHeader 
} from './ui/card';
import Link from 'next/link';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface MaterialCardProps {
  title: string;
  status: string;
  id: string;
  className?: string;
  onDelete?: () => void;
  onEdit?: () => void;
}

function MaterialCard({
  title, 
  status, 
  id, 
  className,
  onDelete,
  onEdit
}: MaterialCardProps) {
  const statusLower = status.toLowerCase();
  
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('.dropdown-trigger')) {
      e.preventDefault();
    }
  };
  
  return (
    <Link href={`/dashboard/materials/${id}`} onClick={handleCardClick}>
      <Card className={cn(
        'flex flex-col shadow-sm hover:shadow-md transition-all hover:border-primary/50 border-gray-200 dark:border-gray-800 cursor-pointer', 
        className
      )}>
        <CardHeader className="pb-2 flex flex-row items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <File size={20} />
            </div>
            <h3 className="font-medium text-base line-clamp-2">{title}</h3>
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
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}>
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
        
        <CardContent className="py-2 mt-auto">
          <Badge variant={
            statusLower === "processed" ? "outline" :
            statusLower === "in-progress" ? "secondary" :
            statusLower === "completed" ? "default" :
            "outline"
          }>
            {status}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  )
}

export default MaterialCard
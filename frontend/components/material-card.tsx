import React from 'react'
import { File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import Link from 'next/link';
import { Badge } from './ui/badge';

interface MaterialCardProps {
  title: string;
  status: string;
  id: string;
  className?: string;
}

function MaterialCard({title, status, id, className}: MaterialCardProps) {
  const statusLower = status.toLowerCase();
  
  return (
    <Card className={cn(
      'flex flex-col h-full shadow-sm hover:shadow-md transition-shadow border-gray-200 dark:border-gray-800', 
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <File size={20} />
          </div>
          <h3 className="font-medium text-base line-clamp-1">{title}</h3>
        </div>
      </CardHeader>
      
      <CardContent className="py-2">
        <Badge variant={
          statusLower === "processed" ? "outline" :
          statusLower === "in-progress" ? "secondary" :
          statusLower === "completed" ? "default" :
          "outline"
        }>
          {status}
        </Badge>
      </CardContent>
      
      <CardFooter className="pt-2 mt-auto pb-3 px-3">
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button variant="outline" size="sm" asChild className="h-8 px-2">
            <Link href={`/dashboard/materials/${id}`}>
              View
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 text-destructive hover:bg-destructive/10 border-destructive/30 hover:border-destructive"
          >
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default MaterialCard
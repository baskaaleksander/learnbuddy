'use client';

import { cn } from '@/lib/utils'
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from './ui/card'
import { Button } from './ui/button'
import { ChevronRight, FileText } from 'lucide-react'
import Link from 'next/link'
import { fetchGraphQL } from '@/utils/gql-axios'
import {GenerateAssetDialog} from "@/components/generate-asset";

interface SummaryData {
  id: string;
  content: {
    title: string;
    chapters: {
      name: string;
      bullet_points: string[];
    }[];
  };
  createdAt: string;
}

function MaterialSummary({id, className} : {id: string, className?: string}) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const summaryResponse = await fetchGraphQL(`
          query GetSummaryByMaterial {
            getSummaryByMaterial(materialId: "${id}") {
              id
              content
              createdAt
            }
          }
        `);
        
        if (summaryResponse.getSummaryByMaterial) {
          setSummary(summaryResponse.getSummaryByMaterial);
        }
      } catch (error) {
        setError("Failed to fetch summary. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSummaryData();
  }, [id]);

  const assetData = {
    title: 'Summary',
    description: 'Generate a summary for this material',
    cost: 2
  }

  const handleGenerateSummary = () => {
    console.log('Generate Summary');
  }

  return (
    <Card className={cn(
        'flex h-full flex-col shadow-sm border-gray-200 dark:border-gray-800', 
        className
    )}>
      <CardHeader className='flex flex-row items-center justify-between'>
        <h2 className='text-lg font-semibold'>Summary</h2>
        {summary && (
          <span className="text-xs text-muted-foreground">
            {new Date(summary.createdAt).toLocaleDateString()}
          </span>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading summary...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center flex-1">
            <p className="text-sm text-destructive text-center">{error}</p>
          </div>
        ) : !summary || !summary.content ? (
          <div className='flex-1 flex flex-col items-center justify-center text-center'>
            <div className="mb-4">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className='text-muted-foreground text-sm'>
                No summary available for this material.
              </p>
            </div>
            <GenerateAssetDialog
              isOpen={generateDialogOpen}
              setIsOpenAction={setGenerateDialogOpen}
              assetData={assetData}
              onGenerateAction={handleGenerateSummary}
              />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-primary">
                {summary.content.title}
              </h3>
            </div>

            <div className="space-y-4 flex-1">
              {summary.content.chapters.slice(0, 2).map((chapter, chapterIndex) => (
                <div key={chapterIndex}>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-medium">{chapter.name}</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {chapter.bullet_points.slice(0, 3).map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="line-clamp-2">{point}</span>
                      </li>
                    ))}
                    {chapter.bullet_points.length > 3 && (
                      <li className="text-xs text-muted-foreground/70 italic">
                        +{chapter.bullet_points.length - 3} more points...
                      </li>
                    )}
                  </ul>
                </div>
              ))}

              {summary.content.chapters.length > 2 && (
                <div className="text-center py-2">
                  <span className="text-xs text-muted-foreground/70 italic">
                    +{summary.content.chapters.length - 2} more chapter{summary.content.chapters.length - 2 !== 1 ? 's' : ''}...
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button asChild variant="outline" className="w-full" size="sm">
                <Link href={`/dashboard/summaries/${summary.id}`}>
                  View Full Summary
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MaterialSummary
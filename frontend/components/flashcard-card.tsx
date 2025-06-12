import React from 'react';
import {FlashcardData} from "@/lib/definitions";
import {cn} from "@/lib/utils";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {AlertTriangle, Calendar, Check, ExternalLink, ReceiptText, X} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import Link from "next/link";



function FlashcardCard({flashcardData, className} : { flashcardData: FlashcardData, className?: string }) {
    const needAttention = flashcardData.review > 0 && flashcardData.known < flashcardData.total;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const knowledgePercentage = flashcardData.known / flashcardData.total * 100;

    const handleMaterialClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        window.location.href = `/dashboard/materials/${flashcardData.material.id}`;
    }
    return (
        <Link href={`/dashboard/flashcards/${flashcardData.id}`}>
            <Card className={cn(
                'flex h-full flex-col shadow-sm hover:shadow-md transition-all dark:border-gray-800 cursor-pointer relative',
                needAttention ? 'border-red-500' : 'border-gray-200',
                needAttention ? 'hover:border-red-500' : 'hover:border-primary/50',
                className
            )}>
                {needAttention && (
                    <div className="absolute top-2 right-2 z-10">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </div>
                )}

                <CardHeader className="pb-3">
                    <div className="space-y-2">
                        <Badge variant="secondary" className="text-xs w-fit flex items-center gap-1">
                            <button
                                onClick={handleMaterialClick}
                                className="flex items-center gap-1 text-xs hover:underline"
                            >
                                <ExternalLink className='inline w-3 h-3'/>
                                {flashcardData.material.title}
                            </button>
                        </Badge>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Created {formatDate(flashcardData.createdAt)}
                        </div>
                    </div>
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
                            <p className={cn("text-lg font-bold", knowledgePercentage < 60 ? "text-red-600" : "text-green-600")}>
                                {flashcardData.review}
                            </p>
                        </div>

                        <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <ReceiptText className="h-4 w-4 text-blue-500" />
                                <span className="text-xs font-medium">Total</span>
                            </div>
                            <p className="text-lg font-bold text-green-600">
                                {flashcardData.total}
                            </p>
                        </div>

                        <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <span className="text-xs font-medium">Knowledge rate</span>
                            </div>
                            <p className={cn("text-lg font-bold",
                                knowledgePercentage < 60
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                            )}>
                                {knowledgePercentage.toFixed(0)}%
                            </p>
                        </div>
                    </div>


                    {needAttention && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    {knowledgePercentage < 60
                                        && "Needs attention"
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}

export default FlashcardCard;
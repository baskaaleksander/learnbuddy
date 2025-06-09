'use client';

import { fetchGraphQL } from '@/utils/gql-axios';
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from './ui/card';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Trash2, RefreshCw, Play, Trophy, Target, Clock } from 'lucide-react';
import Link from 'next/link';

function MaterialQuiz({id, className} : {id: string, className?: string}) {
    const [quizzes, setQuizzes] = useState<any>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchQuizData = async () => {
            try {
                setLoading(true);
                setError(null);
                const quizResponse = await fetchGraphQL(`
                    query GetQuizzesByMaterial {
                        getQuizzesByMaterial(materialId: "${id}") {
                            id
                            createdAt
                            averageScore
                            totalAttempts
                            averagePercentage
                            bestScore
                            latestResult {
                                score
                                completedAt
                            }
                        }
                    }
                `);
                if (quizResponse.getQuizzesByMaterial) {
                    setQuizzes(quizResponse.getQuizzesByMaterial);
                }
            } catch (error) {
                console.error('Error fetching quiz data:', error);
                setError("Failed to fetch quizzes. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchQuizData();
    }, [id]);

    const handleDeleteQuiz = async () => {
        // Add delete logic here
        console.log('Delete quiz');
    };

    const handleRegenerateQuiz = async () => {
        // Add regenerate logic here
        console.log('Regenerate quiz');
    };

    return (
        <Card className={cn(
            'flex h-full flex-col shadow-sm border-gray-200 dark:border-gray-800', 
            className
        )}>
            <CardHeader className='flex flex-row items-center justify-between'>
                <h2 className='text-lg font-semibold'>Quiz</h2>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
                {loading ? (
                    <div className="flex items-center justify-center flex-1">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center flex-1">
                        <p className="text-sm text-destructive text-center">{error}</p>
                    </div>
                ) : !quizzes ? (
                    <div className='flex-1 flex flex-col items-center justify-center text-center'>
                        <div className="mb-4">
                            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className='text-muted-foreground text-sm'>
                                No quizzes available for this material.
                            </p>
                        </div>
                        <Button variant='outline' size="sm">
                            Generate Quiz
                        </Button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col">
                        {/* Stats Section */}
                        <div className="space-y-4 mb-6">
                            {/* Top Row - Main Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center justify-center mb-2">
                                        <Trophy className="h-4 w-4 text-yellow-500" />
                                    </div>
                                    <div className="text-xl font-bold">{quizzes.bestScore}</div>
                                    <div className="text-xs text-muted-foreground">Best Score</div>
                                </div>
                                
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center justify-center mb-2">
                                        <Target className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div className="text-xl font-bold">{quizzes.averageScore.toFixed(1)}</div>
                                    <div className="text-xs text-muted-foreground">Avg Score</div>
                                </div>
                            </div>
                            
                            {/* Bottom Row - Secondary Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center justify-center mb-2">
                                        <Clock className="h-4 w-4 text-green-500" />
                                    </div>
                                    <div className="text-lg font-semibold">{quizzes.totalAttempts}</div>
                                    <div className="text-xs text-muted-foreground">Total Attempts</div>
                                </div>
                                
                                <div className="text-center p-3 bg-muted/50 rounded-lg flex flex-col items-center justify-center">
                                    <div className="flex flex-col items-center justify-center mb-2">
                                        <Badge 
                                            variant={
                                                quizzes.averagePercentage >= 80 ? "default" : 
                                                quizzes.averagePercentage >= 60 ? "secondary" : "destructive"
                                            }
                                            className="text-xs px-2 py-1"
                                        >
                                            {quizzes.averagePercentage.toFixed(0)}%
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">Average percentage rate</div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4 p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium">Latest attempt</h4>
                                <span className="text-xs text-muted-foreground">
                                    {quizzes.latestResult && new Date(quizzes?.latestResult?.completedAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {quizzes.latestResult ? <Badge 
                                    variant={
                                        quizzes?.averageScore >= 8 ? "default" : 
                                        quizzes?.averageScore >= 6 ? "secondary" : "destructive"
                                    }
                                    className="text-xs"
                                >
                                    {quizzes?.latestResult?.score.toFixed(1)}/10
                                </Badge> : <p className='text-xs text-gray-500'>Take your first try now!</p>}
                            </div>
                        </div>

                        <div className="mt-auto space-y-2">
                            <Button asChild className="w-full" size="sm">
                                <Link href={`/dashboard/quizzes/${quizzes?.id}`}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Take Quiz
                                </Link>
                            </Button>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handleRegenerateQuiz}
                                >
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Regenerate
                                </Button>
                                
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handleDeleteQuiz}
                                    className="text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default MaterialQuiz;
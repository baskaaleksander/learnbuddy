'use client';
import QuizCard from '@/components/quiz-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchGraphQL } from '@/utils/gql-axios';
import { ArrowUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react'
import ErrorComponent from '@/components/error-component';
import LoadingScreen from '@/components/loading-screen';

function QuizzesPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [sortBy, setSortBy] = useState<string>('newest');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [totalPages, setTotalPages] = useState<number>(1);

    useEffect(() => {
        const fetchMaterial = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const quizzesResponse = await fetchGraphQL(`
                    query GetQuizesByUser {
                        getQuizesByUser(page: ${page}, pageSize: ${pageSize}) {
                            id
                            createdAt
                            averageScore
                            totalAttempts
                            averagePercentage
                            bestScore
                            createdAt
                            latestResult {
                                score
                                completedAt
                            }
                            material {
                                id
                                title
                                createdAt
                            }
                        }
                    }
                `);
                
                if (quizzesResponse.getQuizesByUser) {
                    setQuizzes(quizzesResponse.getQuizesByUser);
                } else {
                    setError("Quizzes not found");
                }
            } catch (error) {
                console.error("Error fetching material:", error);
                setError("Failed to fetch material. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchMaterial();
    }, [page, pageSize]);

    const filteredAndSorted = useMemo(() => {
        let filtered = quizzes;

        if (searchQuery.trim() !== '') {
            filtered = filtered.filter((quiz) =>
                quiz.material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (quiz.material.description && quiz.material.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
        const sorted = [...filtered].sort((a: any, b: any) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'title-asc':
                    return a.title.localeCompare(b.title);
                case 'title-desc':
                    return b.title.localeCompare(a.title);
                case 'status-asc':
                    return a.status.localeCompare(b.status);
                case 'status-desc':
                    return b.status.localeCompare(a.status);
                default:
                    return 0;
            }
        });
        return sorted
    }, [quizzes, searchQuery, sortBy, page, pageSize]);

    const handlePreviousPage = () => {
        if (page > 1) {
            setPage(page - 1);
        }
    };

    const handleNextPage = () => {
        if (page < totalPages) {
            setPage(page + 1);
        }
    };
    
    if (error) {
        return <ErrorComponent message={error} />;
    }

    if (loading) {
        return <LoadingScreen />
    }
    return (
        <div className="p-4 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Quizzes</h1>
                <p className="text-muted-foreground">
                    {filteredAndSorted.length} quiz{filteredAndSorted.length !== 1 ? 'zes' : ''} found
                </p>
            </div>
            
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search quizzes (by material title/description)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="oldest">Oldest First</SelectItem>
                                <SelectItem value="title-asc">Title A-Z</SelectItem>
                                <SelectItem value="title-desc">Title Z-A</SelectItem>
                                <SelectItem value="status-asc">Status A-Z</SelectItem>
                                <SelectItem value="status-desc">Status Z-A</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={page <= 1}
                        className="flex items-center gap-1"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Previous</span>
                    </Button>
                    
                    <span className="text-sm text-muted-foreground px-2">
                        Page {page} of {totalPages}
                    </span>
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={page >= totalPages}
                        className="flex items-center gap-1"
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAndSorted.length > 0 ? (
                    quizzes.map((quiz) => {
                        return <QuizCard
                            key={quiz.id}
                            quizData={quiz}
                        />
                    })
                ) : (
                    <p>No quizzes found</p>
                )}
            </div>
        </div>
    )
}

export default QuizzesPage
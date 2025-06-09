'use client';
import { fetchGraphQL } from '@/utils/gql-axios';
import React, { useEffect, useState } from 'react'

function QuizzesPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [quizzes, setQuizzes] = useState<any[]>([]);

        useEffect(() => {
            const fetchMaterial = async () => {
                try {
                    setLoading(true);
                    setError(null);
                    
                    const quizzesResponse = await fetchGraphQL(`
                        query GetQuizesByUser {
                            getQuizesByUser {
                                id
                                materialId
                                createdAt
                                material {
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
        }, []);
    
  return (
    <div className="p-4 space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Quizzes</h1>
            <p className="text-muted-foreground">
                1 quiz found
            </p>
        </div>

    </div>
  )
}

export default QuizzesPage
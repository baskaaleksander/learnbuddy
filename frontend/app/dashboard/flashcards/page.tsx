'use client';

import React, {useEffect, useState} from 'react'
import {fetchGraphQL} from "@/utils/gql-axios";

function FlashcardsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        setLoading(true);
        setError(null);
        const flashcardsResponse = await fetchGraphQL(`
        
      } catch (error) {
        setError("Failed to fetch flashcards. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
  }, []);
  return (
    <div>FlashcardsPage</div>
  )
}

export default FlashcardsPage
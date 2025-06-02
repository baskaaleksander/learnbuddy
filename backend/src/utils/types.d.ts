interface Quiz {
    pytanie: string;
    odpowiedz: string;
}

export interface QuizResponse {
    id: string;
    materialId: string;
    type: string;
    content: {
        "flashcards": Quiz[]
    }
    createdAt: Date;
    errorMessage?: string | null;
}
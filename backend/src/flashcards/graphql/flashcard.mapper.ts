import { InferModel } from "drizzle-orm";
import { flashcards } from "src/database/schema";

export type FlashcardsDb = InferModel<typeof flashcards>;

export function toFlashcardGraphQL(flashcard: FlashcardsDb){
    return {
        id: flashcard.id,
        aiOutputId: flashcard.aiOutputId,
        question: flashcard.question,
        answer: flashcard.answer,
        createdAt: flashcard.createdAt,
    };
}
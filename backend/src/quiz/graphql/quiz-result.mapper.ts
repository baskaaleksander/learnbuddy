import { InferModel } from 'drizzle-orm';
import { quizResults } from 'src/database/schema';

export type QuizResultsDb = InferModel<typeof quizResults>;

export function toQuizResultGraphQl(quizResult: QuizResultsDb) {
  return {
    id: quizResult.id,
    userId: quizResult.userId,
    aiOutputId: quizResult.aiOutputId,
    score: quizResult.score,
    totalQuestions: quizResult.totalQuestions,
    answers: quizResult.answers || [],
    materialId: quizResult.materialId,
    completedAt: quizResult.completedAt,
  };
}

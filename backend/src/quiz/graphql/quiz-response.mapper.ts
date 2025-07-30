import { InferModel } from 'drizzle-orm';
import { aiOutputs } from '../../database/schema';
import { QuizResponse } from '../../utils/types';

export type QuizResponseDb = InferModel<typeof aiOutputs>;

export function toQuizResponseGraphQl(
  quizResponse: QuizResponseDb,
): QuizResponse {
  return {
    id: quizResponse.id,
    materialId: quizResponse.materialId,
    type: quizResponse.type as 'quiz',
    content: quizResponse.content as QuizResponse['content'],
    createdAt: quizResponse.createdAt,
    errorMessage: quizResponse.errorMessage || undefined,
  };
}

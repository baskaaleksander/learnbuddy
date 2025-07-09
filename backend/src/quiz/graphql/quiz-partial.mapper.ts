import { InferModel } from 'drizzle-orm';
import { quizPartials } from 'src/database/schema';

export type QuizPartialDb = InferModel<typeof quizPartials>;

export function toQuizPartialGraphQL(quizPartial: QuizPartialDb): {
  id: string;
  userId: string;
  quizId: string;
  currentQuestionIndex: number;
  answers: JSON;
  lastUpdated: Date;
  createdAt: Date;
} {
  return {
    id: quizPartial.id,
    userId: quizPartial.userId,
    quizId: quizPartial.quizId,
    currentQuestionIndex: quizPartial.currentQuestionIndex,
    answers: quizPartial.answers as JSON,
    lastUpdated: quizPartial.lastUpdated,
    createdAt: quizPartial.createdAt,
  };
}

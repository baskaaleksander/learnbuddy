interface Quiz {
  question: string;
  answers: Array<string>;
  correct_answer: string;
}

export interface QuizResponse {
  id: string;
  materialId: string;
  type: 'quiz';
  content: Quiz[];
  createdAt: Date;
  errorMessage?: string | undefined;
}

export interface SummaryAiOutputContent {
  title: string;
  chapters: Array<{
    name: string;
    bullet_points: string[];
  }>;
}

interface Quiz {
  question: string;
  answers: Array<{
    A: string;
    B: string;
    C: string;
  }>;
  correct_answer: string;
}

export interface QuizResponse {
  id: string;
  materialId: string;
  type: string;
  content: Quiz[];
  createdAt: Date;
  errorMessage?: string | null;
}

export interface SummaryAiOutputContent {
  title: string;
  chapters: Array<{
    name: string;
    bullet_points: string[];
  }>;
}

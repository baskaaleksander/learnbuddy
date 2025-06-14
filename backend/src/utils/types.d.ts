interface Quiz {
  pytanie: string;
  odpowiedzi: Array<{
    A: string;
    B: string;
    C: string;
  }>;
  poprawna_odpowiedz: string;
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

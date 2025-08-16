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
    isKnown: boolean;
    isImportant: boolean;
  }>;
}

export interface FlashcardContent {
  flashcards: Array<{
    question: string;
    answer: string;
  }>;
}

export type MockDrizzle = {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  from: jest.Mock;
  where: jest.Mock;
  innerJoin: jest.Mock;
  orderBy: jest.Mock;
  limit: jest.Mock;
  offset: jest.Mock;
  groupBy: jest.Mock;
  returning: jest.Mock;
  values: jest.Mock;
  set: jest.Mock;
};

export interface WelcomeEmailData {
  name: string;
  verifyLink: string;
}

export interface PasswordResetEmailData {
  name: string;
  resetLink: string;
}

export interface SendEmailInterface {
  to: string;
  subject: string;
  template: 'welcome' | 'password-reset';
  data: WelcomeEmailData | PasswordResetEmailData;
}

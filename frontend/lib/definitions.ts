export interface PricingCardProps {
  nameOfPlan: string;
  price: string;
  description: string;
  tokenLimit: string;
  features: Array<{
    name: string;
    isAvailable: boolean;
  }>;
}

export interface FAQProps {
  questions: {
    question: string;
    answer: string;
  }[];
}

export interface AlertInterface {
  title: string;
  description: string;
  type?: "default" | "destructive";
  icon: React.ReactNode;
}

interface ShortMaterialType {
  id: string;
  title: string;
}

export interface FlashcardData {
  id: string;
  createdAt: string;
  total: number;
  known: number;
  review: number;
  lastUpdated: string;
  material: ShortMaterialType;
}

export interface PaginationProps<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface QuizData {
  id: string;
  createdAt: string;
  averageScore: number;
  totalAttempts: number;
  averagePercentage: number;
  bestScore: number;
  latestResult?: {
    score: number;
    completedAt: string;
  };
  material: ShortMaterialType;
}

export interface AssetData {
  title: string;
  description: string;
  cost: number;
}

export interface SummaryContent {
  title: string;
  chapters: Array<{
    name: string;
    bullet_points: string[];
    isKnown: boolean;
    isImportant: boolean;
  }>;
}

export interface SummaryData {
  id: string;
  createdAt: string;
  material: ShortMaterialType;
  title: string;
  chaptersCount: number;
  bulletPointsCount: number;
  content: SummaryContent;
}

export interface MaterialData {
  id: string;
  title: string;
  status: "PROCESSED" | "FAILED" | "PENDING";
  description: string;
  createdAt: string;
}

export interface QuizQuestion {
  question: string;
  answers: {
    A: string;
    B: string;
    C: string;
  };
  correct_answer: string;
}

export interface QuizResult {
  id: string;
  aiOutputId: string;
  materialId: string;
  score: number;
  totalQuestions: number;
  completedAt: Date;
  correctAnswers: string[];
  answers: Array<{
    question: string;
    answer: string;
    isCorrect: boolean;
  }>;
}

export interface QuizResultDetails {
  question: string;
  answer: string;
  isCorrect: boolean;
  correctAnswer: string;
  questionIndex: number;
  totalQuestions: number;
  answers: string[];
}

export interface FlashcardQuestionData {
  flashcardId: string;
  question: string;
  answer: string;
  status: string;
  statusUpdatedAt: Date;
}

export interface CurrentPlanData {
  planName: string;
  planInterval: "MONTHLY" | "YEARLY";
  price: string;
  currency: string;
  status: string;
  createdAt: string;
  nextBillingDate: string;
  tokensUsed: number;
  tokensLimit: number;
}

export interface UserStats {
  materialsCount: number;

  quizzesCount: number;

  flashcardsCount: number;

  summariesCount: number;

  totalQuizResults: number;

  totalFlashcardsKnown: number;

  totalFlashcardsToReview: number;

  recentlyCreatedAiOutputs: any[];

  recentlyCreatedMaterials: MaterialData[];

  quizPartialsIds: string[];
}

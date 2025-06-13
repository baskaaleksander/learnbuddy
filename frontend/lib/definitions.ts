export interface PricingCardProps {
    price: string;
    nameOfPlan: string;
    description: string;
    features: {
        name: string;
        isAvailable: boolean;
    }[];
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
  type?: 'default' | 'destructive';
  icon: React.ReactNode;
}

export interface FlashcardData {
  id: string;
  createdAt: string;
  total: number;
  known: number;
  review: number;
  lastUpdated: string;
  material: {
    id: string;
    title: string;
  };
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
    material: {
        id: string;
        title: string;
        createdAt: string;
    };
}

export interface AssetData {
    title: string;
    description: string;
    cost: number;
}
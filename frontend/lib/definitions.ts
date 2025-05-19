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
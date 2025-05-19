export interface PricingCardProps {
    price: string;
    nameOfPlan: string;
    description: string;
    features: {
        name: string;
        isAvailable: boolean;
    }[];
}
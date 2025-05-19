import React from 'react'
import PricingCard from './pricing-card'
import { PricingCardProps } from '@/lib/definitions'

function PricingSection() {

    // Sample data for pricing cards
    const pricingCards: PricingCardProps[] = [
        {
            nameOfPlan: 'Basic Plan',
            price: '$9.99/month',
            description: 'Perfect for individuals looking to get started.',
            features: [
                { name: 'Access to all features', isAvailable: true },
                { name: 'AI-generated materials', isAvailable: true },
                { name: 'Personalized study resources', isAvailable: false },
                { name: 'Track your progress', isAvailable: false },
                { name: 'Community support', isAvailable: false }
            ]
        },
        {
            nameOfPlan: 'Pro Plan',
            price: '$19.99/month',
            description: 'Ideal for professionals and teams.',
            features: [
                { name: 'Access to all features', isAvailable: true },
                { name: 'AI-generated materials', isAvailable: true },
                { name: 'Personalized study resources', isAvailable: true },
                { name: 'Track your progress', isAvailable: false },
                { name: 'Community support', isAvailable: false }
            ]
        },
        {
            nameOfPlan: 'Premium Plan',
            price: '$29.99/month',
            description: 'Best for organizations and institutions.',
            features: [
                { name: 'Access to all features', isAvailable: true },
                { name: 'AI-generated materials', isAvailable: true },
                { name: 'Personalized study resources', isAvailable: true },
                { name: 'Track your progress', isAvailable: true },
                { name: 'Community support', isAvailable: true }
            ]
        }
    ]
  return (
    <div className='flex flex-col items-center px-[10%] py-4 md:py-12 lg:py-20 text-center'>
        <h2 className='text-primary text-lg font-semibold'>Pricing</h2>
        <h3 className='text-3xl font-semibold mt-4'>Choose the plan that fits your learning journey</h3>
        <p className='mt-4 md:mt-6 text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-3xl text-center'>
            Select a plan that matches your goals. Upgrade anytime as your learning needs grow—each plan unlocks more features to support your progress.
        </p>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 pt-16 md:pt-20 lg:pt-24'>
        {pricingCards.map((card, idx) => (
            <PricingCard key={card.nameOfPlan} {...card} />
        ))}
        </div>
    </div>
  )
}

export default PricingSection
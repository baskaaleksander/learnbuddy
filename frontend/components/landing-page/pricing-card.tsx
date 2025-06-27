import React from 'react'
import { CircleX, CircleCheck } from 'lucide-react'
import { PricingCardProps } from '@/lib/definitions'
import Link from 'next/link'

function PricingCard(pricingCardProps: PricingCardProps) {
  return (
    <div className='flex flex-col items-center p-6 md:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200'>
        <h2 className='text-xl md:text-2xl lg:text-3xl font-semibold'>{pricingCardProps.price}</h2>
        <h3 className='text-lg md:text-xl lg:text-2xl font-semibold mt-4'>{pricingCardProps.nameOfPlan}</h3>
        <span className='text-sm md:text-base lg:text-lg text-gray-500 dark:text-gray-400 mt-2'>{pricingCardProps.description}</span>
        <ul className='mt-6 space-y-2'>
            {pricingCardProps.features.map((feature, index) => (
                <li key={index} className='flex items-center text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400'>
                    {feature.isAvailable ? (
                        <CircleCheck className='h-4 w-4 text-green-500 mr-2' />
                    ) : (
                        <CircleX className='h-4 w-4 text-red-500 mr-2' />
                    )}
                    {feature.name}
                </li>
            ))}
        </ul>
        <button className='mt-6 py-2 w-full bg-primary text-white font-medium rounded-lg transition duration-200 hover:brightness-90'>
            <Link href='/register'>Get Started</Link>
        </button>
    </div>
  )
}

export default PricingCard
import React from 'react'
import AccordionComp from './accordion-comp'

function FaqPricing() {
    const questions = [
        {
            question: "Is this platform suitable for beginners?",
            answer: "Absolutely! Our platform is designed to cater to learners of all levels, including beginners. We provide resources and support to help you get started on your learning journey."
        },
        {
            question: "Can I use this platform for self-study?",
            answer: "Yes, our platform is perfect for self-study. You can access a wide range of materials and resources to help you learn at your own pace."
        },
        {
            question: "Are there any prerequisites to use this platform?",
            answer: "No prerequisites are required. Our platform is designed to be user-friendly and accessible to everyone."
        },
        {
            question: "Is there a free trial available?",
            answer: "Yes, we offer a free trial period for new users to explore the platform and its features before committing to a subscription."
        },
    ]
  return (
    <div className='pt-24 px-[10%] flex flex-col items-center text-center'>
        <h2 className='text-primary text-lg font-semibold'>FAQ</h2>
        <h3 className='text-3xl font-semibold mt-4'>Frequently Asked Questions</h3>
        <p className='mt-4 md:mt-6 text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-3xl text-center'>
            Find answers to the most common questions about our platform, features, and how to get started.
        </p>
        <AccordionComp questions={questions} />
    </div>
  )
}

export default FaqPricing
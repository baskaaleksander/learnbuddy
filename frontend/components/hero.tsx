import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { LucideArrowRight } from 'lucide-react'
import BadgeWithLink from './ui/badge-with-link'

function Hero() {
  const fullText = "Make learning smarter than ever!";
  const [displayText, setDisplayText] = useState("");
  const [typingComplete, setTypingComplete] = useState(false);
  
  useEffect(() => {
    setDisplayText("");
    let currentIndex = 0;
    
    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setTypingComplete(true);
      }
    }, 100);
    
    return () => clearInterval(typingInterval);
  }, []);
  
  return (
    <div className='flex flex-col items-center justify-center w-full py-8 md:py-16 lg:py-24 px-4 md:px-8 lg:px-12'>
      <div className='flex flex-col items-center justify-center p-4 md:p-6 text-center mt-4 md:mt-8 w-full max-w-5xl'>
        <BadgeWithLink text="Right now 40% off on all plans" link="/pricing" linkText="Check pricing" />

        <h1 className='text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold text-gray-900 dark:text-white leading-tight'>
          {displayText}
        </h1>
        
        <p className='mt-4 md:mt-6 text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-3xl'>
          AI-powered platform designed to help you learn faster and remember longer.
          Track your progress and master any subject with personalized study plans.
        </p>
      </div>
      
      <div className='flex flex-col sm:flex-row gap-4 sm:gap-6 mt-6 md:mt-10'>
        <Button size="lg" className='w-full sm:w-auto px-8 py-6 text-lg'>
          Get Started <LucideArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <Button variant='outline' size="lg" className='w-full sm:w-auto px-8 py-6 text-lg'>
          Learn More
        </Button>
      </div>
    </div>
  )
}

export default Hero
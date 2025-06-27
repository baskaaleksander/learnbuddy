import React from 'react'

function UsingStepCard({title, description, number}: {title: string; description: string; number: number}) {
  return (
    <div className='flex flex-col items-center justify-center p-4 mb-8 md:mb-10'>
        <span className='flex items-center justify-center text-primary text-xl md:text-2xl lg:text-3xl mb-4 md:mb-5 bg-[#F9F5FF] p-4 md:p-5 rounded-full w-14 h-14 md:w-16 md:h-16 font-bold'>
          {number}
        </span>
        <div className='text-center'>
            <h3 className='text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-gray-200 pt-4'>{title}</h3>
            <p className='mt-2 md:mt-3 text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-xs'>{description}</p>
        </div>
    </div>
  )
}

export default UsingStepCard
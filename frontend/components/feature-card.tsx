import React from 'react'

function FeatureCard({title, description, icon}: {title: string; description: string; icon: React.ReactNode}) {
  return (
    <div className="w-full px-4 mb-8 md:mb-10">
        <div className='flex flex-col items-center justify-center p-4'>
            <div className='text-primary text-3xl md:text-4xl lg:text-5xl mb-4 md:mb-5 bg-[#F9F5FF] p-4 md:p-5 rounded-full'>
                {icon}
            </div>
            <h3 className='text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-gray-200 pt-4'>{title}</h3>
            <p className='mt-2 md:mt-3 text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400 text-center max-w-xs'>
                {description}
            </p>
        </div>
    </div>
  )
}

export default FeatureCard
import React from 'react'
import { Card, CardHeader } from './ui/card'
import { cn } from '@/lib/utils'

function QuizCard({ quizData, className } : { quizData: any, className?: string }) {
  return (
    <Card className={cn(
        'flex h-full flex-col shadow-sm hover:shadow-md transition-all hover:border-primary/50 border-gray-200 dark:border-gray-800 cursor-pointer', 
        className
      )}>
        <CardHeader>
            
        </CardHeader>
    </Card>
      )
}

export default QuizCard
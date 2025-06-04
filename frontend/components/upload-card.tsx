import Link from 'next/link'
import React from 'react'
import { Card, CardHeader } from './ui/card'
import { cn } from '@/lib/utils'
import { Upload } from 'lucide-react'

function UploadCard({ className } : { className?: string }) {
  return (
    <Link href={`/dashboard/materials/upload`}>
      <Card className={cn(
        'flex flex-col justify-center items-center shadow-sm hover:shadow-md transition-all hover:border-primary/50 border-gray-200 dark:border-gray-800 cursor-pointer h-full', 
        className
      )}>
        <Upload size={40} className="text-primary mb-2" />
            <h3 className="font-medium text-base line-clamp-2">Upload your material</h3>
      </Card>
    </Link>
  )
}

export default UploadCard
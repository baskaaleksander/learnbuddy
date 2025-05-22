import React from 'react'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { AlertCircle } from 'lucide-react'
import { AlertInterface } from '@/lib/definitions'

function AlertBox({ title, description, type, icon } : AlertInterface) {
  return (
    <Alert variant={type ? type : "default"} className='mb-6'>
      {icon}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {description}
      </AlertDescription>
    </Alert>  )
}

export default AlertBox
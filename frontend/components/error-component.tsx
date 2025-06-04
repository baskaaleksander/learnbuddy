import React from 'react'


// to be done/upgraded later

function ErrorComponent({ message }: {message: string}) {
  return (
    <div>
        <p className="text-red-500">{message}</p>
        <p className="text-gray-500">Please try again later.</p>
    </div>
  )
}

export default ErrorComponent
import React from 'react'

function LoadingScreen() {

    // upgrade it later
  return (
    <div>
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            <p className="text-center text-gray-500 pt-10">Loading, please wait...</p>
        </div>
    </div>
  )
}

export default LoadingScreen
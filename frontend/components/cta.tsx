import React from 'react'

function CTA() {
  return (
    <div className="bg-gray-100 dark:bg-background mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Join Us Today!
          </h2>
          <p className="mt-4 md:mt-6 text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Discover a smarter way to learn with our interactive platform, designed to help you achieve your goals at your own pace. Sign up now and get started with our free plan—no credit card required!
          </p>
          <a
            href="/register"
            className="inline-block bg-primary text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-primary-dark transition duration-300 text-base md:text-lg"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  )
}

export default CTA
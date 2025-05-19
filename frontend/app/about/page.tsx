import DescriptionSection from '@/components/description-section'
import React from 'react'

function AboutPage() {
  return (
    <div className='pb-24 flex flex-col items-center justify-center'>
        <DescriptionSection
            title="Who we are?"
            secondaryTitle="Get to know each other"
            description="Hi! I'm a solo developer and currently a student myself. I started this project because I understand firsthand the challenges that come with learning new things. My goal is to create an app that makes learning easier and more accessible for everyone, no matter where you are in your educational journey. By combining my passion for technology and education, I hope to help others achieve their goals and make the process of learning more enjoyable and effective." 
        />
        {/* add contact form */}
        <DescriptionSection
            title="Our mission?"
            secondaryTitle="Learn about our mission"
            description="We are dedicated to providing a platform that simplifies the learning process and empowers users to reach their full potential. Our app leverages advanced technology to create personalized learning experiences, making it easier for individuals to acquire new skills and knowledge. We believe that everyone deserves access to quality education, and we strive to make that a reality through our innovative solutions."
        />
    </div>
  )
}

export default AboutPage
import Link from 'next/link'
import React from 'react'
import logo from "@/public/logo.svg"
import Image from 'next/image'
function Footer() {
  // add privacy policy and terms of service links
  const footerLinks = [
    { name: "Home", path: "/", subLinks: [
      { name: "Features", path: "/" },
      { name: "Showcase", path: "/" },
      { name: "How it works?", path: "/" },
      { name: "For who?", path: "/" }
    ] },
    { name: "Pricing", path: "/", subLinks: [
      { name: "Plans", path: "/" },
      { name: "Features", path: "/" },
      { name: "FAQs", path: "/" }
    ] },
    { name: "About", path: "/", subLinks: [
      { name: "Who we are?", path: "/" },
      { name: "Contact", path: "/" }
    ] }
  ]
  return (
    <footer className='pt-10 pb-5 px-[10%] border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'>
        <div className='flex flex-col items-center md:items-start justify-around md:flex-row'>
        <Image src={logo} alt="LearnBuddy" width={140} height={40} className="hidden md:block md:w-[140px] lg:w-[180px]" />
        {footerLinks.map((link, index) => (
          <ul key={index} className='flex flex-col items-center md:items-start'>
            <li className='font-semibold hover:text-primary pb-2'><Link href={link.path}>{link.name}</Link></li>
            {link.subLinks.map((subLink, subIndex) => (
              <li key={subIndex} className='text-gray-500 dark:text-gray-400 hover:text-primary pb-1'><Link href={subLink.path}>{subLink.name}</Link></li>
            ))}
          </ul>
        ))}
        <Link className='font-semibold hover:text-primary' href='/dashboard'>Dashboard</Link>
        </div>
        <div className="w-full my-6">
          <span className="block h-px bg-gray-200 dark:bg-gray-700 w-full"></span>
        </div>
        <div>
          <p className='text-center text-sm text-gray-500 dark:text-gray-400'>
            &copy; {new Date().getFullYear()} LearnBuddy. All rights reserved.
          </p>
        </div>
    </footer>
  )
}

export default Footer
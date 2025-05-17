'use client';
import Image from 'next/image'
import React from 'react'
import defaultAvatar from "@/public/avatar.svg" 
import { useAuth } from '@/providers/auth-provider';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

function Navbar() {
    const { user } = useAuth();
    const pathname = usePathname();

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Pricing", path: "/pricing" },
        { name: "About", path: "/about" },
        { name: "Contact", path: "/contact" },
    ]
  return (
    <nav className='hidden md:flex items-center justify-between border-b border-gray-200 w-full'>
      <div className='flex items-center w-full max-w-7xl mx-auto px-6 lg:px-8 py-4'>
        <div className='flex items-center flex-shrink-0'>
          <Image src="logo.svg" alt="LearnBuddy" width={140} height={40} className="md:w-[140px] lg:w-[180px]" />
        </div>
        
        <div className='ml-6 lg:ml-10 flex-grow'>
          <ul className='flex flex-wrap'>
            {navLinks.map((link, index) => {
              const isActive = pathname === link.path;
              return (
                <li key={index} className='mr-2 md:mr-3 lg:mr-6'>
                  <Link 
                    href={link.path} 
                    className={`font-semibold text-base lg:text-lg py-2 transition-colors ${
                      isActive 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className='flex-shrink-0 ml-4'>
          {user && (
            <div className='flex items-center'>
              <span className='hidden lg:block mr-3 text-sm font-medium'>
                {user.email}
              </span>
              <Image 
                src={defaultAvatar} 
                alt="User avatar" 
                width={40} 
                height={40} 
                className="rounded-full border border-gray-200"
              />
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
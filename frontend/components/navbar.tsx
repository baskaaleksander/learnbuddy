'use client';
import Image from 'next/image'
import React from 'react'
import defaultAvatar from "@/public/avatar.svg" 
import { useAuth } from '@/providers/auth-provider';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from './ui/dropdown-menu';
import { LucideChevronDown } from 'lucide-react';
import { Button } from './ui/button';

function Navbar() {
    const { user } = useAuth();
    const pathname = usePathname();

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Pricing", path: "/pricing" },
        { name: "Contact", path: "/contact" },
    ]
  return (
    <nav className='hidden md:flex items-center justify-between border-b border-gray-200 dark:border-gray-800 w-full bg-background'>
      <div className='flex items-center w-full max-w-7xl mx-auto px-6 lg:px-8 py-4 h-16'>
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
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className='flex-shrink-0 ml-4 h-10 flex items-center'>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="h-10 flex items-center">
                <div className='flex items-center gap-1'>
                    <Image 
                        src={defaultAvatar} 
                        alt="User" 
                        width={40} 
                        height={40} 
                        className="rounded-full border border-gray-200 dark:border-gray-700 hover:brightness-90 transition w-10 h-10 object-cover"
                    />
                    <LucideChevronDown className='h-4 w-4' />
                </div>
              </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuItem>Team</DropdownMenuItem>
                <DropdownMenuItem>Subscription</DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="h-10 flex items-center">
              <Button variant="default" className='text-sm px-4 py-2 h-10'>
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="outline" className='text-sm px-4 py-2 ml-2 h-10'>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
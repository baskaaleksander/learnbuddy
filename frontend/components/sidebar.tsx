'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon, LogOut, XIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/providers/auth-provider';
import Image from 'next/image';
import defaultAvatar from "@/public/avatar.svg" 


interface SidebarProps {
  paths: Array<{
    category: string;
    links: Array<{
      name: string;
      path: string;
      icon: React.ReactNode;
    }>;
  }>;
  isOpen: boolean;
  toggle: () => void;
  isMobile?: boolean;
}

function Sidebar({ paths, isOpen, toggle, isMobile = false }: SidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
    
    if (mounted && isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, isMobile, mounted]);

  // Fix desktop sidebar to properly hide on mobile
  if (!isMobile) {
    return (
      <div
        className={cn(
          'min-h-screen h-full border-r border-gray-200 dark:border-gray-800 bg-background transition-all duration-300 ease-in-out hidden md:flex md:flex-col',
          isOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="sticky top-0 z-10">
          <div className="h-16 flex items-center justify-end px-4 border-b border-gray-200 dark:border-gray-800">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggle}
              className="h-8 w-8"
            >
              {isOpen ? <ChevronLeftIcon size={18} /> : <ChevronRightIcon size={18} />}
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <SidebarContent paths={paths} isOpen={isOpen} pathname={pathname} />
        </div>
        
        {user && (
          <div className="mt-auto border-t border-gray-200 dark:border-gray-800 p-4">
            <div className={cn(
              "flex items-center", 
              isOpen ? "justify-between" : "justify-center"
            )}>
              <div className="flex items-center space-x-3">
                <Image
                    src={defaultAvatar}
                    alt="User Avatar"
                    width={32}
                    height={32}
                    className="rounded-full"
                    />
                {isOpen && <p className="text-sm font-medium truncate max-w-[140px]">{user.email}</p>}
              </div>
              
              {isOpen && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={logout} 
                  className="h-8 px-2"
                >
                  <LogOut size={18} />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className="flex flex-col h-full"
            initial={{ x: -300, opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="h-16 flex items-center justify-end px-4 border-b border-gray-200 dark:border-gray-800">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggle}
                className="h-8 w-8"
              >
                <XIcon size={18} />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <SidebarContent 
                paths={paths} 
                isOpen={true} 
                pathname={pathname} 
                animate={true} 
              />
            </div>
                    {user && (
          <div className="mt-auto border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Image
                    src={defaultAvatar}
                    alt="User Avatar"
                    width={32}
                    height={32}
                    className="rounded-full"
                    />
                <p className="text-sm font-medium truncate max-w-[140px]">{user.email}</p>
              </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={logout} 
                  className="h-8 px-2"
                >
                  <LogOut size={18} />
                </Button>

            </div>
          </div>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SidebarContent({ 
  paths, 
  isOpen, 
  pathname,
  animate = false 
}: { 
  paths: SidebarProps['paths'], 
  isOpen: boolean, 
  pathname: string,
  animate?: boolean 
}) {
  return (
    <div className="px-3 py-4">
      {paths.map((category, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <div className={cn(
              "h-px bg-gray-200 dark:bg-gray-800 my-4", 
              isOpen ? "mx-3" : "mx-1"
            )} />
          )}
          
          <div className="mb-6">
            {isOpen && (
              <div className="px-3 mb-2">
                {animate ? (
                  <motion.p 
                    className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + (index * 0.05), duration: 0.2 }}
                  >
                    {category.category}
                  </motion.p>
                ) : (
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {category.category}
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-1">
              {category.links.map((link, linkIndex) => {
                const isActive = pathname === link.path;
                const linkElement = (
                  <Link
                    href={link.path}
                    className={cn(
                      'flex items-center px-3 py-2 rounded-md text-sm transition-colors',
                      isActive 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <div className={cn("text-lg", !isOpen && "mx-auto")}>{link.icon}</div>
                    {isOpen && <span className="ml-3">{link.name}</span>}
                  </Link>
                );
                
                return animate ? (
                  <motion.div
                    key={linkIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      delay: 0.15 + (index * 0.05) + (linkIndex * 0.05), 
                      duration: 0.25
                    }}
                  >
                    {linkElement}
                  </motion.div>
                ) : (
                  <div key={linkIndex}>{linkElement}</div>
                );
              })}
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

export default Sidebar;
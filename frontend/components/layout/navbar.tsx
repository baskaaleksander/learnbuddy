"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import defaultAvatar from "@/public/avatar.svg";
import { useAuth, UserData } from "@/providers/auth-provider";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LucideChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/public/logo.svg";
import HamburgerButton from "@/components/ui/hamburger-button";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const hideNavbar = pathname.startsWith("/dashboard");

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Pricing", path: "/pricing" },
    { name: "About", path: "/about" },
  ];
  return !hideNavbar ? (
    <>
      <DesktopNavbar
        user={user}
        logout={logout}
        navLinks={navLinks}
        pathname={pathname}
      />
      <MobileNavbar
        user={user}
        logout={logout}
        navLinks={navLinks}
        pathname={pathname}
      />
    </>
  ) : null;
}

function DesktopNavbar({
  user,
  logout,
  navLinks,
  pathname,
}: {
  user: UserData | null;
  logout: () => void;
  navLinks: { name: string; path: string }[];
  pathname: string;
}) {
  const router = useRouter();
  const handleDashboardClick = () => {
    router.push("/dashboard");
  };

  const handleAccountClick = () => {
    router.push("/dashboard/settings");
  };

  const handleBillingClick = () => {
    router.push("/dashboard/billing");
  };
  return (
    <nav className="hidden sm:flex items-center justify-between border-b border-gray-200 dark:border-gray-800 w-full bg-background">
      <div className="flex items-center w-full max-w-7xl mx-auto px-6 lg:px-8 py-4 h-16">
        <div className="flex items-center flex-shrink-0">
          <Image
            src={logo}
            alt="LearnBuddy"
            width={140}
            height={40}
            className="md:w-[140px] lg:w-[180px]"
          />
        </div>

        <div className="ml-6 lg:ml-10 flex-grow">
          <ul className="flex flex-wrap">
            {navLinks.map((link, index) => {
              const isActive = pathname === link.path;
              return (
                <li key={index} className="mr-2 md:mr-3 lg:mr-6">
                  <Link
                    href={link.path}
                    className={`font-semibold text-base lg:text-lg py-2 transition-colors ${
                      isActive
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}
            {user && (
              <li className="mr-2 md:mr-3 lg:mr-6">
                <Link
                  href="/dashboard"
                  className={`font-semibold text-base lg:text-lg py-2 transition-colors ${
                    pathname.startsWith("/dashboard")
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Dashboard
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div className="flex-shrink-0 ml-4 h-10 flex items-center">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="h-10 flex items-center">
                <div className="flex items-center gap-1">
                  <Image
                    src={defaultAvatar}
                    alt="User"
                    width={40}
                    height={40}
                    className="rounded-full border border-gray-200 dark:border-gray-700 hover:brightness-90 transition w-10 h-10 object-cover"
                  />
                  <LucideChevronDown className="h-4 w-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>{user.firstName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDashboardClick()}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBillingClick()}>
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAccountClick()}>
                  Account
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="font-semibold text-destructive"
                  onClick={() => logout()}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="h-10 flex items-center">
              <Button
                size="sm"
                variant="default"
                className="text-sm px-4 py-2 h-10"
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-sm px-4 py-2 ml-2 h-10"
              >
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function MobileNavbar({
  user,
  logout,
  navLinks,
  pathname,
}: {
  user: UserData | null;
  logout: () => void;
  navLinks: { name: string; path: string }[];
  pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <>
      <nav className="flex sm:hidden justify-between items-center border-b border-gray-200 dark:border-gray-800 w-full bg-background px-4 py-2 fixed top-0 left-0 right-0 z-50">
        <Image
          src={logo}
          alt="LearnBuddy"
          width={140}
          height={40}
          className="w-[140px] lg:w-[180px]"
        />
        <HamburgerButton isOpen={isOpen} toggle={() => setIsOpen(!isOpen)} />
      </nav>

      <div className="h-[56px] sm:hidden"></div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-background z-40 sm:hidden flex flex-col pt-14"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <motion.div
              className="flex flex-col items-center justify-start h-full w-full px-6 py-10 overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <ul className="flex flex-col items-center space-y-8 w-full">
                {navLinks.map((link, index) => {
                  const isActive = pathname === link.path;
                  return (
                    <motion.li
                      key={index}
                      className="w-full text-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 + index * 0.1 }}
                    >
                      <Link
                        href={link.path}
                        className={`block font-semibold text-xl py-2 transition-colors ${
                          isActive
                            ? "text-primary"
                            : "text-gray-600 dark:text-gray-300"
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {link.name}
                      </Link>
                    </motion.li>
                  );
                })}
                {user && (
                  <motion.li
                    className="w-full text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: 0.1 + navLinks.length * 0.1,
                    }}
                  >
                    <Link
                      href="/dashboard"
                      className={`block font-semibold text-xl py-2 transition-colors ${
                        pathname.startsWith("/dashboard")
                          ? "text-primary"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                  </motion.li>
                )}
              </ul>

              <motion.div
                className="mt-auto w-full flex flex-col items-center space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                {user ? (
                  <div className="w-full">
                    <div className="flex items-center p-4 border-t border-b border-gray-200 dark:border-gray-700">
                      <Image
                        src={defaultAvatar}
                        alt="User"
                        width={40}
                        height={40}
                        className="rounded-full border border-gray-200 dark:border-gray-700 mr-3"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">
                          {user.firstName}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col w-full items-start p-2">
                      <Link href="/dashboard/settings">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-base py-6"
                          onClick={() => setIsOpen(false)}
                        >
                          Account
                        </Button>
                      </Link>
                      <Link href="/dashboard/billing">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-base py-6"
                          onClick={() => setIsOpen(false)}
                        >
                          Billing
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-base py-6 text-destructive"
                        onClick={() => {
                          logout();
                          setIsOpen(false);
                        }}
                      >
                        Logout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="default"
                      className="w-full text-base py-6"
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href="/login" className="w-full">
                        Login
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-base py-6"
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href="/register" className="w-full">
                        Register
                      </Link>
                    </Button>
                  </>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;

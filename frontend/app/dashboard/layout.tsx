"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import {
  HomeIcon,
  BookIcon,
  SettingsIcon,
  MessageCircleQuestion,
  Zap,
  BookText,
  DollarSign,
  MenuIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const segments = pathname.split("/");
  const title = segments[2]
    ? segments[2].charAt(0).toUpperCase() + segments[2].slice(1)
    : "Dashboard";

  useEffect(() => {
    document.title = `${title} | LearnBuddy`;
  }, [title]);

  const sidebarPaths = [
    {
      category: "General",
      links: [
        { name: "Dashboard", path: "/dashboard", icon: <HomeIcon size={18} /> },
        {
          name: "Materials",
          path: "/dashboard/materials",
          icon: <BookIcon size={18} />,
        },
        {
          name: "Quizzes",
          path: "/dashboard/quizzes",
          icon: <MessageCircleQuestion size={18} />,
        },
        {
          name: "Flashcards",
          path: "/dashboard/flashcards",
          icon: <Zap size={18} />,
        },
        {
          name: "Summaries",
          path: "/dashboard/summaries",
          icon: <BookText size={18} />,
        },
      ],
    },
    {
      category: "Account",
      links: [
        {
          name: "Billing",
          path: "/dashboard/billing",
          icon: <DollarSign size={18} />,
        },
        {
          name: "Settings",
          path: "/dashboard/settings",
          icon: <SettingsIcon size={18} />,
        },
      ],
    },
  ];

  useEffect(() => {
    if (!user && !authLoading) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false); // Close sidebar on small screens
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <Sidebar
          paths={sidebarPaths}
          isOpen={sidebarOpen}
          toggle={() => setSidebarOpen(!sidebarOpen)}
          isMobile={false}
        />

        {/* Mobile Sidebar */}
        <Sidebar
          paths={sidebarPaths}
          isOpen={mobileSidebarOpen}
          toggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          isMobile={true}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="md:hidden p-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <MenuIcon size={18} />
            </Button>
          </div>

          {children}
          <Toaster />
        </main>
      </div>
    </>
  );
}

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import React from "react";
import {
  Book,
  FileText,
  Layers,
  ClipboardList,
  CheckCircle,
  RefreshCcw,
  Info,
} from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function AssetsStats({
  materialsCount,
  quizzesCount,
  flashcardsCount,
  summariesCount,
  totalFlashcardsKnown,
  totalFlashcardsToReview,
}: {
  materialsCount: number;
  quizzesCount: number;
  flashcardsCount: number;
  summariesCount: number;
  totalFlashcardsKnown: number;
  totalFlashcardsToReview: number;
}) {
  const stats = [
    {
      label: "Materials",
      value: materialsCount,
      emoji: <Book className="h-6 w-6 text-blue-500" />,
      href: "/dashboard/materials",
      tooltip: "Total learning materials you've created or uploaded.",
    },
    {
      label: "Quizzes",
      value: quizzesCount,
      emoji: <ClipboardList className="h-6 w-6 text-purple-500" />,
      href: "/dashboard/quizzes",
      tooltip: "Number of quizzes available for you.",
    },
    {
      label: "Flashcard sets",
      value: flashcardsCount,
      emoji: <Layers className="h-6 w-6 text-yellow-500" />,
      href: "/dashboard/flashcards",
      tooltip: "Total flashcard sets you have.",
    },
    {
      label: "Summaries",
      value: summariesCount,
      emoji: <FileText className="h-6 w-6 text-green-500" />,
      href: "/dashboard/summaries",
      tooltip: "Summaries generated from your materials.",
    },
    {
      label: "Known Flashcards",
      value: totalFlashcardsKnown,
      emoji: <CheckCircle className="h-6 w-6 text-emerald-500" />,
      href: "/dashboard/flashcards",
      tooltip: "Flashcards you've marked as known.",
    },
    {
      label: "To Review Flashcards",
      value: totalFlashcardsToReview,
      emoji: <RefreshCcw className="h-6 w-6 text-orange-500" />,
      href: "/dashboard/flashcards",
      tooltip: "Flashcards due for review.",
    },
  ];
  return (
    <Card className="p-4">
      <CardHeader>
        <h2 className="text-base md:text-lg lg:text-xl font-semibold">
          Your statistics
        </h2>
        <p className="text-sm text-muted-foreground">
          Here are your current statistics across all learning assets. Click on
          any item to view more details.
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TooltipProvider>
          {stats.map((stat) => (
            <Link href={stat.href} key={stat.label}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-4 bg-muted/60 rounded-lg flex flex-col items-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {stat.emoji}
                      <span className="text-sm font-medium">{stat.label}</span>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <span>{stat.tooltip}</span>
                </TooltipContent>
              </Tooltip>
            </Link>
          ))}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

export default AssetsStats;

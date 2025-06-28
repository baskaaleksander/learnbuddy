import { SummaryContent } from "@/lib/definitions";
import { Dot, Check, AlertTriangle } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function TableOfContents({
  content,
  onMarkAsKnown,
  onMarkAsImportant,
}: {
  content: SummaryContent;
  onMarkAsKnown: (index: number) => void;
  onMarkAsImportant: (index: number) => void;
}) {
  const scrollToChapter = (chapterName: string) => {
    const element = document.getElementById(encodeURIComponent(chapterName));
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCheckboxClick = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    onMarkAsKnown(index);
  };

  const handleImportantClick = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    onMarkAsImportant(index);
  };

  const knownChaptersCount = content.chapters.filter(
    (chapter) => chapter.isKnown
  ).length;

  const importantChaptersCount = content.chapters.filter(
    (chapter) => chapter.isImportant
  ).length;

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-3">
        <h2 className="text-xl font-semibold text-foreground">
          Table of contents
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Click to navigate • Click checkbox to mark as known • Click triangle
          to mark as important
        </p>
      </div>

      <div className="space-y-2">
        {content.chapters.map((chapter, index) => {
          const isKnown = chapter.isKnown;
          const isImportant = chapter.isImportant;

          return (
            <Button
              key={index}
              variant="ghost"
              className={cn(
                "w-full justify-start h-auto p-3 text-left transition-all duration-200",
                "hover:bg-accent/50 border border-transparent hover:border-border",
                isKnown && "bg-primary/10 border-primary/20 text-primary",
                isImportant && "bg-red-50 border-red-200"
              )}
              onClick={() => scrollToChapter(chapter.name)}
            >
              <div className="flex items-center gap-3 w-full">
                <div
                  className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full border-2 transition-colors cursor-pointer hover:scale-110",
                    isKnown
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground hover:border-primary"
                  )}
                  onClick={(e) => handleCheckboxClick(index, e)}
                >
                  {isKnown ? (
                    <Check size={12} />
                  ) : (
                    <Dot size={16} className="text-muted-foreground" />
                  )}
                </div>

                <div
                  className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full transition-colors cursor-pointer hover:scale-110",
                    isImportant
                      ? "text-red-600"
                      : "text-muted-foreground hover:text-red-600"
                  )}
                  onClick={(e) => handleImportantClick(index, e)}
                >
                  <AlertTriangle size={14} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      "text-base font-medium leading-tight",
                      isKnown && "line-through opacity-70",
                      isImportant && "text-red-700 font-semibold"
                    )}
                  >
                    {chapter.name}
                  </h3>
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      <div className="pt-3 border-t border-gray-200 space-y-1">
        <p className="text-sm text-muted-foreground">
          {knownChaptersCount} of {content.chapters.length} chapters marked as
          known
        </p>
        <p className="text-sm text-muted-foreground">
          {importantChaptersCount} of {content.chapters.length} chapters marked
          as important
        </p>
      </div>
    </div>
  );
}

export default TableOfContents;

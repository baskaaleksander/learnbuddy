import { SummaryData } from "@/lib/definitions";
import React from "react";
import { Check, Dot, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

function SummaryChapter({
  chapter,
  index,
  onMarkAsKnown,
  onMarkAsImportant,
}: {
  chapter: SummaryData["content"]["chapters"][number];
  index: number;
  onMarkAsKnown: (index: number) => void;
  onMarkAsImportant: (index: number) => void;
}) {
  return (
    <div
      id={`${encodeURIComponent(chapter.name)}`}
      className={cn(
        "bg-card border border-gray-200 rounded-lg p-6 shadow-sm space-y-4 transition-all duration-200",
        chapter.isKnown && "bg-primary/5 border-primary/20",
        chapter.isImportant && "bg-red-50 border-red-200"
      )}
    >
      <div className="flex items-center justify-between">
        <h3
          className={cn(
            "text-xl font-semibold text-foreground border-b border-gray-200 pb-2 flex-1",
            chapter.isKnown && "line-through opacity-70",
            chapter.isImportant && "text-red-700"
          )}
        >
          {chapter.name}
        </h3>
        <div className="flex items-center gap-2 ml-4">
          <div
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors cursor-pointer hover:scale-110",
              chapter.isKnown
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground hover:border-primary"
            )}
            onClick={() => onMarkAsKnown(index)}
          >
            {chapter.isKnown ? (
              <Check size={14} />
            ) : (
              <Dot size={18} className="text-muted-foreground" />
            )}
          </div>
          <div
            className={cn(
              "flex items-center justify-center w-6 h-6 transition-colors cursor-pointer hover:scale-110",
              chapter.isImportant
                ? "text-red-600"
                : "text-muted-foreground hover:text-red-600"
            )}
            onClick={() => onMarkAsImportant(index)}
          >
            <AlertTriangle size={16} />
          </div>
        </div>
      </div>
      <ul className="list-disc pl-6 space-y-3">
        {chapter.bullet_points.map((point, pointIndex) => (
          <li
            key={pointIndex}
            className={cn(
              "text-base text-foreground leading-relaxed",
              chapter.isKnown && "opacity-70",
              chapter.isImportant && "font-medium"
            )}
          >
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SummaryChapter;

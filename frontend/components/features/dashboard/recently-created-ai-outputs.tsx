import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AiOutputData } from "@/lib/definitions";
import {
  Book,
  BookText,
  Calendar,
  ExternalLink,
  MessageCircleQuestion,
  Zap,
} from "lucide-react";
import Link from "next/link";
import React from "react";

function RecentlyCreatedAiOutputs({
  aiOutputsData,
}: {
  aiOutputsData: AiOutputData[];
}) {
  const handleMaterialClick = (materialId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    window.location.href = `/dashboard/materials/${materialId}`;
  };
  console.log("RecentlyCreatedAiOutputs", aiOutputsData);
  return (
    <Card className="p-4 w-full">
      <CardHeader>
        <h2 className="text-base md:text-lg lg:text-xl font-semibold">
          Recent Learning Outputs
        </h2>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {aiOutputsData.map((aiOutput) => {
            const icon =
              aiOutput.type === "FLASHCARDS" ? (
                <Zap className="h-7 w-7 text-primary" />
              ) : aiOutput.type === "SUMMARY" ? (
                <BookText className="h-7 w-7 text-primary" />
              ) : (
                <MessageCircleQuestion className="h-7 w-7 text-primary" />
              );

            const name =
              aiOutput.type === "FLASHCARDS"
                ? "flashcards"
                : aiOutput.type === "SUMMARY"
                ? "summaries"
                : "quizzes";
            return (
              <li key={aiOutput.id}>
                <Link
                  href={`/dashboard/${name}/${aiOutput.id}`}
                  className="group flex items-center gap-4 rounded-lg px-3 py-2 hover:bg-muted transition"
                >
                  <div className="flex flex-col items-center justify-center">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate text-base group-hover:underline">
                        {aiOutput.type.charAt(0) +
                          aiOutput.type.slice(1).toLowerCase()}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-xs w-fit flex items-center gap-1"
                      >
                        <button
                          onClick={handleMaterialClick(aiOutput.material.id)}
                          className="flex items-center gap-1 text-xs hover:underline"
                        >
                          <ExternalLink className="inline w-3 h-3" />
                          {aiOutput.material.title}
                        </button>
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(aiOutput.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

export default RecentlyCreatedAiOutputs;

import { FlashcardQuestionData } from "@/lib/definitions";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Check, X } from "lucide-react";

import { Switch } from "./ui/switch";

function FlashcardQuestionCard({
  flashcardQuestionData,
  onProgressUpdated,
}: {
  flashcardQuestionData: FlashcardQuestionData;
  onProgressUpdated?: (flashcardId: string, status: string) => void;
}) {
  const [status, setStatus] = useState(flashcardQuestionData.status);

  useEffect(() => {
    setStatus(flashcardQuestionData.status);
  }, [flashcardQuestionData.status]);

  const handleStatusUpdate = (newStatus: string) => {
    setStatus(newStatus);
    onProgressUpdated?.(flashcardQuestionData.flashcardId, newStatus);
  };

  const toggleStatus = () => {
    const newStatus = status === "known" ? "review" : "known";
    handleStatusUpdate(newStatus);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <h2 className="text-lg font-semibold">
          {flashcardQuestionData.question}
        </h2>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          {flashcardQuestionData.answer}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <label
          htmlFor={`flashcard-status-${flashcardQuestionData.flashcardId}`}
          className="flex items-center space-x-2"
        >
          {status === "known" ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
          <Switch
            id={`flashcard-status-${flashcardQuestionData.flashcardId}`}
            checked={status === "known"}
            onCheckedChange={toggleStatus}
          />
          <span className="text-sm text-gray-500">
            {status === "known" ? "Known" : "Review"}
          </span>
        </label>
      </CardFooter>
    </Card>
  );
}

export default FlashcardQuestionCard;

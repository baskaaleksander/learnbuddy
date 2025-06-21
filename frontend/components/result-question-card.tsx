import { QuizResultDetails } from "@/lib/definitions";
import React from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Check, X } from "lucide-react";

function ResultQuestionCard(props: QuizResultDetails) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <p className="text-base md:text-lg text-muted-foreground">
          Question {props.questionIndex + 1} of {props.totalQuestions}
        </p>
        {props.isCorrect ? (
          <div className="bg-green-100 p-2.5 rounded-full flex items-center justify-center shrink-0">
            <Check className="text-green-600 w-6 h-6" />
          </div>
        ) : (
          <div className="bg-red-100 p-2.5 rounded-full flex items-center justify-center shrink-0">
            <X className="text-red-600 w-6 h-6" />
          </div>
        )}
      </CardHeader>
      <CardContent></CardContent>
    </Card>
  );
}

export default ResultQuestionCard;

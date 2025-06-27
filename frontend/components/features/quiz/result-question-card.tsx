import { QuizResultDetails } from "@/lib/definitions";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";

function ResultQuestionCard(props: QuizResultDetails) {
  return (
    <Card className="p-4">
      <CardContent className="p-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Question {props.questionIndex + 1}
          </span>
          {props.isCorrect ? (
            <Check className="text-green-600 w-5 h-5" />
          ) : (
            <X className="text-red-600 w-5 h-5" />
          )}
        </div>
        <h3 className="text-base font-medium">{props.question}</h3>
        <div className="space-y-2">
          {props.answers.map((answer, index) => (
            <div
              key={index}
              className={`p-3 border border-gray-200 rounded-md ${
                answer === props.correctAnswer
                  ? "bg-green-50 text-green-800"
                  : props.answer === answer && "bg-red-50 text-red-800"
              }`}
            >
              {answer}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ResultQuestionCard;

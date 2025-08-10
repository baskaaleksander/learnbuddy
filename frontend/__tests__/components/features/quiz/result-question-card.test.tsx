import React from "react";
import { render, screen } from "@/__tests__/utils/test-utils";
import ResultQuestionCard from "@/components/features/quiz/result-question-card";
import { QuizResultDetails } from "@/lib/definitions";

describe("Result Question Card", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseData = (
    overrides: Partial<QuizResultDetails> = {}
  ): QuizResultDetails => ({
    question: "What is 2 + 2?",
    answer: "B",
    isCorrect: false,
    correctAnswer: "A",
    questionIndex: 0,
    totalQuestions: 3,
    answers: ["A", "B", "C"],
    ...overrides,
  });

  it("renders with required props", () => {
    render(<ResultQuestionCard {...baseData()} />);

    expect(screen.getByText(/question 1/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /what is 2 \+ 2\?/i })
    ).toBeInTheDocument();

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("displays correct icon when answer is correct", () => {
    render(<ResultQuestionCard {...baseData({ isCorrect: true })} />);

    const checkIcons = document.querySelectorAll(".lucide-check");
    const xIcons = document.querySelectorAll(".lucide-x");
    expect(checkIcons.length).toBeGreaterThan(0);
    expect(xIcons.length).toBe(0);
  });

  it("displays incorrect icon when answer is wrong", () => {
    render(<ResultQuestionCard {...baseData({ isCorrect: false })} />);

    const xIcons = document.querySelectorAll(".lucide-x");
    const checkIcons = document.querySelectorAll(".lucide-check");
    expect(xIcons.length).toBeGreaterThan(0);
    expect(checkIcons.length).toBe(0);
  });

  it("highlights correct answer in green", () => {
    render(
      <ResultQuestionCard
        {...baseData({ correctAnswer: "A", answer: "B", isCorrect: false })}
      />
    );

    const correctEl = screen.getByText("A");
    expect(correctEl).toHaveClass("bg-green-50");
    expect(correctEl).toHaveClass("text-green-800");
  });

  it("highlights selected incorrect answer in red", () => {
    render(
      <ResultQuestionCard
        {...baseData({ correctAnswer: "A", answer: "B", isCorrect: false })}
      />
    );

    const wrongSelectedEl = screen.getByText("B");
    expect(wrongSelectedEl).toHaveClass("bg-red-50");
    expect(wrongSelectedEl).toHaveClass("text-red-800");
  });

  it("handles empty answers gracefully", () => {
    render(<ResultQuestionCard {...baseData({ answers: [] })} />);

    expect(screen.getByText(/question 1/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /what is 2 \+ 2\?/i })
    ).toBeInTheDocument();

    const highlighted = document.querySelectorAll(".bg-green-50, .bg-red-50");
    expect(highlighted.length).toBe(0);
  });
});

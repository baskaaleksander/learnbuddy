import React from "react";
import { render, screen } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import QuizResultCard from "@/components/features/quiz/quiz-result-card";
import { QuizResult } from "@/lib/definitions";

jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

describe("Quiz Result Card", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseResult = (overrides: Partial<QuizResult> = {}): QuizResult => ({
    id: "qr1",
    aiOutputId: "ai1",
    materialId: "m1",
    score: 8,
    totalQuestions: 10,
    completedAt: new Date("2024-01-01T00:00:00.000Z"),
    correctAnswers: ["A", "B", "C"],
    answers: [
      { question: "Q1", answer: "A", isCorrect: true },
      { question: "Q2", answer: "B", isCorrect: true },
    ],
    ...overrides,
  });

  it("renders with required props", () => {
    const data = baseResult();
    render(<QuizResultCard {...data} />);

    expect(screen.getByText(/8\/10/i)).toBeInTheDocument();
    expect(screen.getByText(/80%/i)).toBeInTheDocument();
    expect(screen.getByText(/excellent/i)).toBeInTheDocument();

    const expectedDate = new Date(data.completedAt).toLocaleDateString();
    expect(screen.getByText(expectedDate)).toBeInTheDocument();

    expect(screen.getByText(/10 questions/i)).toBeInTheDocument();
    expect(screen.getByText(/view details/i)).toBeInTheDocument();
  });

  it("renders a link with correct href and fires click event", async () => {
    const user = userEvent.setup();
    const data = baseResult({ id: "result-123" });
    render(<QuizResultCard {...data} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      `/dashboard/quizzes/result/${data.id}`
    );

    const onClick = jest.fn();
    link.addEventListener("click", onClick);
    await user.click(link);
    expect(onClick).toHaveBeenCalled();
  });

  it("displays fallback when data is missing or zeroed", () => {
    render(
      <QuizResultCard
        {...(baseResult({ score: 0 }) as any)}
        {...({ totalQuestions: undefined } as any)}
      />
    );

    expect(screen.queryByText(/questions/i)).not.toBeInTheDocument();
    expect(screen.getByText(/nan%/i)).toBeInTheDocument();
    expect(screen.getByText(/needs improvement/i)).toBeInTheDocument();
  });
});

import React from "react";
import { render, screen, waitFor } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import QuizCard from "@/components/features/quiz/quiz-card";
import { createMockQuiz } from "@/__tests__/utils/test-utils";
import { QuizData } from "@/lib/definitions";

jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

jest.mock("@/app/hooks/use-media-query", () => ({
  __esModule: true,
  default: () => true,
}));

describe("Quiz Card", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeQuiz = (overrides: Partial<QuizData> = {}): QuizData =>
    ({
      ...(createMockQuiz() as any),
      ...overrides,
    } as QuizData);

  it("renders with required props", () => {
    render(<QuizCard quizData={makeQuiz()} />);

    expect(screen.getByText(/created/i)).toBeInTheDocument();
    expect(screen.getByText(/attempts/i)).toBeInTheDocument();
    expect(screen.getByText(/average/i)).toBeInTheDocument();
    expect(screen.getByText(/best score/i)).toBeInTheDocument();
    expect(screen.getByText(/latest score/i)).toBeInTheDocument();
    expect(screen.getByText(/click to view/i)).toBeInTheDocument();
  });

  it("displays material title and navigates to material on click", async () => {
    const data = makeQuiz({ material: { id: "m123", title: "Calculus I" } });
    render(<QuizCard quizData={data} />);

    const materialBtn = screen.getByRole("button", { name: /calculus i/i });
    const originalLocation = window.location;
    // Mock window.location to avoid jsdom navigation errors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    Object.defineProperty(window, "location", {
      value: { href: "http://localhost/" },
      writable: true,
    });
    await userEvent.click(materialBtn);
    expect(window.location.href).toBe("/dashboard/materials/m123");
    // restore
    Object.defineProperty(window, "location", { value: originalLocation });
  });

  it("fires click on the card link", async () => {
    const user = userEvent.setup();
    const data = makeQuiz({ id: "q-001" });
    render(<QuizCard quizData={data} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/dashboard/quizzes/${data.id}`);

    const onClick = jest.fn();
    link.addEventListener("click", onClick);
    await user.click(link);
    expect(onClick).toHaveBeenCalled();
  });

  it("displays fallback when latest result is missing", () => {
    const data = makeQuiz({ latestResult: undefined });
    render(<QuizCard quizData={data} />);

    expect(screen.getByText(/latest score/i)).toBeInTheDocument();
    expect(screen.getByText(/n\/a/i)).toBeInTheDocument();
  });

  it("shows attention messages based on state", () => {
    render(
      <QuizCard
        quizData={makeQuiz({ totalAttempts: 0, averagePercentage: 10 })}
      />
    );
    expect(screen.getByText(/no attempts yet/i)).toBeInTheDocument();

    render(
      <QuizCard
        quizData={makeQuiz({ totalAttempts: 2, averagePercentage: 50 })}
      />
    );
    expect(screen.getByText(/low average score/i)).toBeInTheDocument();
  });
});

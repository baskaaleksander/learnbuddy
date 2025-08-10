import React from "react";
import { render, screen } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import QuizPartials from "@/components/features/dashboard/quiz-partials";

jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

describe("QuizPartials", () => {
  const makePartial = (overrides: Partial<any> = {}) => ({
    id: "partial-1",
    userId: "user-1",
    quizId: "quiz-1",
    currentQuestionIndex: 0,
    lastUpdated: "2024-01-01T00:00:00.000Z",
    createdAt: "2023-12-31T00:00:00.000Z",
    ...overrides,
  });

  it("renders with required props", () => {
    const quizPartialsData = [
      makePartial({ id: "p1", quizId: "q1", currentQuestionIndex: 0 }),
      makePartial({ id: "p2", quizId: "q2", currentQuestionIndex: 4 }),
    ];
    const totalQuizResults = 7;

    render(
      <QuizPartials
        quizPartialsData={quizPartialsData}
        totalQuizResults={totalQuizResults}
      />
    );

    expect(
      screen.getByRole("heading", { name: /quiz partials/i })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        `You have ${quizPartialsData.length} quiz partials saved, with a total of ${totalQuizResults} quiz results.`
      )
    ).toBeInTheDocument();

    expect(screen.getAllByRole("listitem").length).toBe(
      quizPartialsData.length
    );

    expect(screen.getByText(/question 1/i)).toBeInTheDocument();
    expect(screen.getByText(/question 5/i)).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/dashboard/quizzes/q1/take");
    expect(links[1]).toHaveAttribute("href", "/dashboard/quizzes/q2/take");

    const goButtons = screen.getAllByRole("button", { name: /go to quiz/i });
    expect(goButtons).toHaveLength(quizPartialsData.length);

    expect(screen.getAllByText(/updated:/i).length).toBe(
      quizPartialsData.length
    );
  });

  it("fires click when a quiz partial link is clicked", async () => {
    const user = userEvent.setup();
    const quizPartialsData = [makePartial({ id: "p1", quizId: "q1" })];

    render(
      <QuizPartials quizPartialsData={quizPartialsData} totalQuizResults={3} />
    );

    const link = screen.getByRole("link", { name: /question 1/i });
    const clickHandler = jest.fn();
    link.addEventListener("click", clickHandler);

    await user.click(link);
    expect(clickHandler).toHaveBeenCalled();
  });

  it("navigates to quiz when 'Go to Quiz' is clicked", async () => {
    const user = userEvent.setup();
    const quizId = "q123";
    const quizPartialsData = [makePartial({ id: "p1", quizId })];

    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, href: "http://localhost/" },
    });

    render(
      <QuizPartials quizPartialsData={quizPartialsData} totalQuizResults={1} />
    );

    const goBtn = screen.getByRole("button", { name: /go to quiz/i });
    await user.click(goBtn);

    expect(window.location.href).toBe(`/dashboard/quizzes/${quizId}/`);

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("displays fallback when no data", () => {
    render(<QuizPartials quizPartialsData={[]} totalQuizResults={0} />);

    expect(
      screen.getByRole("heading", { name: /no quiz partials saved/i })
    ).toBeInTheDocument();

    const startLink = screen.getByRole("link", { name: /start new quiz/i });
    expect(startLink).toHaveAttribute("href", "/dashboard/quizzes/");

    expect(
      screen.queryByText(/click on a quiz partial to continue/i)
    ).not.toBeInTheDocument();
  });
});

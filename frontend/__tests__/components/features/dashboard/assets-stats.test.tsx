import React from "react";
import { render, screen } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import AssetsStats from "@/components/features/dashboard/assets-stats";

describe("AssetsStats", () => {
  const defaultProps = {
    materialsCount: 3,
    quizzesCount: 2,
    flashcardsCount: 4,
    summariesCount: 5,
    totalFlashcardsKnown: 7,
    totalFlashcardsToReview: 6,
  };

  it("renders with required props", () => {
    render(<AssetsStats {...defaultProps} />);

    expect(
      screen.getByRole("heading", { name: /your statistics/i })
    ).toBeInTheDocument();

    // Labels
    expect(screen.getByText(/materials/i)).toBeInTheDocument();
    expect(screen.getByText(/quizzes/i)).toBeInTheDocument();
    expect(screen.getByText(/flashcard sets/i)).toBeInTheDocument();
    expect(screen.getByText(/summaries/i)).toBeInTheDocument();
    expect(screen.getByText(/known flashcards/i)).toBeInTheDocument();
    expect(screen.getByText(/to review flashcards/i)).toBeInTheDocument();

    // Values
    [
      defaultProps.materialsCount,
      defaultProps.quizzesCount,
      defaultProps.flashcardsCount,
      defaultProps.summariesCount,
      defaultProps.totalFlashcardsKnown,
      defaultProps.totalFlashcardsToReview,
    ].forEach((val) => {
      expect(screen.getByText(String(val))).toBeInTheDocument();
    });

    // Links
    expect(screen.getByRole("link", { name: /materials/i })).toHaveAttribute(
      "href",
      "/dashboard/materials"
    );
    expect(screen.getByRole("link", { name: /quizzes/i })).toHaveAttribute(
      "href",
      "/dashboard/quizzes"
    );
    expect(
      screen.getByRole("link", { name: /flashcard sets/i })
    ).toHaveAttribute("href", "/dashboard/flashcards");
    expect(screen.getByRole("link", { name: /summaries/i })).toHaveAttribute(
      "href",
      "/dashboard/summaries"
    );
    expect(
      screen.getByRole("link", { name: /known flashcards/i })
    ).toHaveAttribute("href", "/dashboard/flashcards");
    expect(
      screen.getByRole("link", { name: /to review flashcards/i })
    ).toHaveAttribute("href", "/dashboard/flashcards");
  });

  it("fires click event when a stat card is clicked (via anchor)", async () => {
    const user = userEvent.setup();
    render(<AssetsStats {...defaultProps} />);

    const materialsLink = screen.getByRole("link", { name: /materials/i });
    const clickHandler = jest.fn();
    materialsLink.addEventListener("click", clickHandler);

    await user.click(materialsLink);
    expect(clickHandler).toHaveBeenCalled();
  });

  it("displays fallback values when data is zero/missing-like", () => {
    render(
      <AssetsStats
        materialsCount={0}
        quizzesCount={0}
        flashcardsCount={0}
        summariesCount={0}
        totalFlashcardsKnown={0}
        totalFlashcardsToReview={0}
      />
    );

    // All tiles should render with 0
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(6);

    // Ensure no literal undefined/null leaks into UI
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/null/i)).not.toBeInTheDocument();
  });
});

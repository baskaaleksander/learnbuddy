import { render, screen } from "../../../utils/test-utils";
import userEvent from "@testing-library/user-event";
import AssetsStats from "@/components/features/dashboard/assets-stats";

describe("AssetsStats", () => {
  const user = userEvent.setup();

  const defaultProps = {
    materialsCount: 5,
    quizzesCount: 3,
    flashcardsCount: 8,
    summariesCount: 2,
    totalFlashcardsKnown: 15,
    totalFlashcardsToReview: 7,
  };

  it("should display all six statistics cards", () => {
    render(<AssetsStats {...defaultProps} />);

    expect(screen.getByText("Materials")).toBeInTheDocument();
    expect(screen.getByText("Quizzes")).toBeInTheDocument();
    expect(screen.getByText("Flashcard sets")).toBeInTheDocument();
    expect(screen.getByText("Summaries")).toBeInTheDocument();
    expect(screen.getByText("Known Flashcards")).toBeInTheDocument();
    expect(screen.getByText("To Review Flashcards")).toBeInTheDocument();
  });

  it("should show correct values for each statistic", () => {
    render(<AssetsStats {...defaultProps} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("should render appropriate icons for each statistic", () => {
    render(<AssetsStats {...defaultProps} />);

    const cards = screen.getAllByRole("link");
    expect(cards).toHaveLength(6);
  });

  it("should display tooltips with descriptions", async () => {
    render(<AssetsStats {...defaultProps} />);

    const materialsCard = screen.getByText("Materials").closest("a");
    expect(materialsCard).toBeInTheDocument();

    if (materialsCard) {
      await user.hover(materialsCard);

      expect(screen.getByText(/total learning materials/i)).toBeInTheDocument();
    }
  });

  it("should navigate to correct pages when cards are clicked", async () => {
    render(<AssetsStats {...defaultProps} />);

    const materialsLink = screen.getByText("Materials").closest("a");
    const quizzesLink = screen.getByText("Quizzes").closest("a");
    const flashcardsLink = screen.getByText("Flashcard sets").closest("a");
    const summariesLink = screen.getByText("Summaries").closest("a");

    expect(materialsLink).toHaveAttribute("href", "/dashboard/materials");
    expect(quizzesLink).toHaveAttribute("href", "/dashboard/quizzes");
    expect(flashcardsLink).toHaveAttribute("href", "/dashboard/flashcards");
    expect(summariesLink).toHaveAttribute("href", "/dashboard/summaries");
  });

  it("should apply responsive grid layout", () => {
    const { container } = render(<AssetsStats {...defaultProps} />);

    const gridContainer = container.querySelector(".grid");
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass(
      "grid-cols-1",
      "md:grid-cols-2",
      "lg:grid-cols-3"
    );
  });

  it("should handle zero values gracefully", () => {
    const zeroProps = {
      materialsCount: 0,
      quizzesCount: 0,
      flashcardsCount: 0,
      summariesCount: 0,
      totalFlashcardsKnown: 0,
      totalFlashcardsToReview: 0,
    };

    render(<AssetsStats {...zeroProps} />);

    expect(screen.getAllByText("0")).toHaveLength(6);
  });

  it("should apply consistent styling across all cards", () => {
    const { container } = render(<AssetsStats {...defaultProps} />);

    const cards = container.querySelectorAll(
      ".text-center.p-4.bg-muted\\/60.rounded-lg"
    );
    expect(cards).toHaveLength(6);
  });

  it("should be accessible with proper ARIA labels", () => {
    render(<AssetsStats {...defaultProps} />);

    expect(
      screen.getByRole("heading", { name: /your statistics/i })
    ).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link).toHaveAttribute("href");
    });
  });

  it("should show tooltip content on hover", async () => {
    render(<AssetsStats {...defaultProps} />);

    const materialsCard = screen.getByText("Materials").closest("a");
    if (materialsCard) {
      await user.hover(materialsCard);

      expect(
        screen.getByText(/total learning materials you've created/i)
      ).toBeInTheDocument();
    }
  });

  it("should handle large numbers correctly", () => {
    const largeProps = {
      materialsCount: 999,
      quizzesCount: 1000,
      flashcardsCount: 1500,
      summariesCount: 500,
      totalFlashcardsKnown: 2500,
      totalFlashcardsToReview: 300,
    };

    render(<AssetsStats {...largeProps} />);

    expect(screen.getByText("999")).toBeInTheDocument();
    expect(screen.getByText("1000")).toBeInTheDocument();
    expect(screen.getByText("1500")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("2500")).toBeInTheDocument();
    expect(screen.getByText("300")).toBeInTheDocument();
  });
});

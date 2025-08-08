import React from "react";
import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import FlashcardQuestionCard from "@/components/features/flashcards/flashcard-question-card";
import { FlashcardQuestionData } from "@/lib/definitions";
import { toast } from "sonner";

describe("Flashcard Question Card", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseData = (
    overrides: Partial<FlashcardQuestionData> = {}
  ): FlashcardQuestionData => ({
    flashcardId: "fc-1",
    question: "What is the capital of France?",
    answer: "Paris",
    status: "review",
    statusUpdatedAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
  });

  it("should render question and answer correctly", () => {
    render(<FlashcardQuestionCard flashcardQuestionData={baseData()} />);

    expect(
      screen.getByRole("heading", { name: /what is the capital of france\?/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/paris/i)).toBeInTheDocument();
  });

  it("should initialize status based on flashcardQuestionData", () => {
    const { rerender } = render(
      <FlashcardQuestionCard
        flashcardQuestionData={baseData({ status: "known" })}
      />
    );

    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAttribute("data-state", "checked");
    expect(screen.getByText(/known/i)).toBeInTheDocument();

    rerender(
      <FlashcardQuestionCard
        flashcardQuestionData={baseData({ status: "review" })}
      />
    );
    expect(switchEl).toHaveAttribute("data-state", "unchecked");
    expect(screen.getByText(/review/i)).toBeInTheDocument();
  });

  it("should update status when switch is toggled", async () => {
    const user = userEvent.setup();
    render(
      <FlashcardQuestionCard
        flashcardQuestionData={baseData({ status: "review" })}
      />
    );

    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAttribute("data-state", "unchecked");
    expect(screen.getByText(/review/i)).toBeInTheDocument();

    await user.click(switchEl);

    expect(switchEl).toHaveAttribute("data-state", "checked");
    expect(screen.getByText(/known/i)).toBeInTheDocument();
  });

  it("should call onProgressUpdated with correct args on status change", async () => {
    const user = userEvent.setup();
    const onProgressUpdated = jest.fn();
    const data = baseData({ status: "review" });

    render(
      <FlashcardQuestionCard
        flashcardQuestionData={data}
        onProgressUpdated={onProgressUpdated}
      />
    );

    const switchEl = screen.getByRole("switch");
    await user.click(switchEl);

    expect(onProgressUpdated).toHaveBeenCalledTimes(1);
    expect(onProgressUpdated).toHaveBeenCalledWith(data.flashcardId, "known");
  });

  it('should display correct icon and label for "known" status', () => {
    render(
      <FlashcardQuestionCard
        flashcardQuestionData={baseData({ status: "known" })}
      />
    );

    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAttribute("data-state", "checked");
    expect(screen.getByText(/known/i)).toBeInTheDocument();

    const checkIcons = document.querySelectorAll(".lucide-check");
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('should display correct icon and label for "review" status', () => {
    render(
      <FlashcardQuestionCard
        flashcardQuestionData={baseData({ status: "review" })}
      />
    );

    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAttribute("data-state", "unchecked");
    expect(screen.getByText(/review/i)).toBeInTheDocument();

    const xIcons = document.querySelectorAll(".lucide-x");
    expect(xIcons.length).toBeGreaterThan(0);
  });

  it("should update status if flashcardQuestionData.status prop changes", () => {
    const { rerender } = render(
      <FlashcardQuestionCard
        flashcardQuestionData={baseData({ status: "review" })}
      />
    );

    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAttribute("data-state", "unchecked");
    expect(screen.getByText(/review/i)).toBeInTheDocument();

    rerender(
      <FlashcardQuestionCard
        flashcardQuestionData={baseData({ status: "known" })}
      />
    );

    expect(switchEl).toHaveAttribute("data-state", "checked");
    expect(screen.getByText(/known/i)).toBeInTheDocument();
  });

  it("should handle rapid status toggling correctly", async () => {
    const user = userEvent.setup();
    const onProgressUpdated = jest.fn();
    render(
      <FlashcardQuestionCard
        flashcardQuestionData={baseData({ status: "review" })}
        onProgressUpdated={onProgressUpdated}
      />
    );

    const switchEl = screen.getByRole("switch");
    await user.click(switchEl); // review -> known
    await user.click(switchEl); // known -> review
    await user.click(switchEl); // review -> known

    expect(onProgressUpdated).toHaveBeenCalledTimes(3);
    expect(onProgressUpdated).toHaveBeenNthCalledWith(1, "fc-1", "known");
    expect(onProgressUpdated).toHaveBeenNthCalledWith(2, "fc-1", "review");
    expect(onProgressUpdated).toHaveBeenNthCalledWith(3, "fc-1", "known");
  });
});

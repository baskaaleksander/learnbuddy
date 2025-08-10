import React from "react";
import { render, screen } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import SummaryChapter from "@/components/features/summaries/summary-chapter";

describe("Summary Chapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseChapter = {
    name: "Introduction to Biology",
    bullet_points: [
      "Cells are the basic unit of life",
      "DNA carries genetic information",
      "Evolution explains diversity of life",
    ],
    isKnown: false,
    isImportant: false,
  };

  it("renders with required props", () => {
    const onMarkAsKnown = jest.fn();
    const onMarkAsImportant = jest.fn();

    const { container } = render(
      <SummaryChapter
        chapter={baseChapter}
        index={0}
        onMarkAsKnown={onMarkAsKnown}
        onMarkAsImportant={onMarkAsImportant}
      />
    );

    expect(
      screen.getByRole("heading", { name: /introduction to biology/i })
    ).toBeInTheDocument();

    baseChapter.bullet_points.forEach((p) => {
      expect(screen.getByText(p)).toBeInTheDocument();
    });

    const toggles = container.querySelectorAll(".cursor-pointer");
    expect(toggles.length).toBeGreaterThanOrEqual(2);
  });

  it("displays chapter name and bullet points correctly", () => {
    render(
      <SummaryChapter
        chapter={baseChapter}
        index={2}
        onMarkAsKnown={jest.fn()}
        onMarkAsImportant={jest.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: baseChapter.name })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(
      baseChapter.bullet_points.length
    );
  });

  it("calls handlers when toggles are clicked", async () => {
    const user = userEvent.setup();
    const onMarkAsKnown = jest.fn();
    const onMarkAsImportant = jest.fn();

    const { container } = render(
      <SummaryChapter
        chapter={baseChapter}
        index={1}
        onMarkAsKnown={onMarkAsKnown}
        onMarkAsImportant={onMarkAsImportant}
      />
    );

    const toggles = container.querySelectorAll(".cursor-pointer");
    expect(toggles.length).toBeGreaterThanOrEqual(2);

    await user.click(toggles[0] as Element);
    expect(onMarkAsKnown).toHaveBeenCalledWith(1);

    await user.click(toggles[1] as Element);
    expect(onMarkAsImportant).toHaveBeenCalledWith(1);
  });

  it("handles empty data without crashing (fallback)", () => {
    const chapter = {
      name: "",
      bullet_points: [] as string[],
      isKnown: false,
      isImportant: false,
    };

    const { container } = render(
      <SummaryChapter
        chapter={chapter}
        index={0}
        onMarkAsKnown={jest.fn()}
        onMarkAsImportant={jest.fn()}
      />
    );

    expect(screen.queryAllByRole("listitem")).toHaveLength(0);

    const toggles = container.querySelectorAll(".cursor-pointer");
    expect(toggles.length).toBeGreaterThanOrEqual(2);
  });
});

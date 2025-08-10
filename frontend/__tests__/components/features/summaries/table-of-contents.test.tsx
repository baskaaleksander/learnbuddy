import React from "react";
import { render, screen } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import TableOfContents from "@/components/features/summaries/table-of-contents";

describe("Table of contents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseContent = {
    chapters: [
      {
        name: "Introduction",
        bullet_points: [],
        isKnown: true,
        isImportant: false,
      },
      {
        name: "Deep Dive",
        bullet_points: [],
        isKnown: false,
        isImportant: true,
      },
      {
        name: "Appendix",
        bullet_points: [],
        isKnown: false,
        isImportant: false,
      },
    ],
  };

  it("renders with required props", () => {
    const onMarkAsKnown = jest.fn();
    const onMarkAsImportant = jest.fn();

    render(
      <TableOfContents
        content={baseContent as any}
        onMarkAsKnown={onMarkAsKnown}
        onMarkAsImportant={onMarkAsImportant}
      />
    );

    expect(
      screen.getByRole("heading", { name: /table of contents/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /click to navigate • click checkbox to mark as known • click triangle to mark as important/i
      )
    ).toBeInTheDocument();

    baseContent.chapters.forEach((c) => {
      // Each chapter is rendered as a button with its name
      expect(screen.getByRole("button", { name: c.name })).toBeInTheDocument();
    });

    // Summary counts
    expect(
      screen.getByText(/1 of 3 chapters marked as known/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1 of 3 chapters marked as important/i)
    ).toBeInTheDocument();
  });

  it("calls handlers when known/important toggles are clicked", async () => {
    const user = userEvent.setup();
    const onMarkAsKnown = jest.fn();
    const onMarkAsImportant = jest.fn();

    render(
      <TableOfContents
        content={baseContent as any}
        onMarkAsKnown={onMarkAsKnown}
        onMarkAsImportant={onMarkAsImportant}
      />
    );

    const firstChapterButton = screen.getByRole("button", {
      name: baseContent.chapters[0].name,
    });

    const toggles = (firstChapterButton as HTMLElement).querySelectorAll(
      ".cursor-pointer"
    );
    expect(toggles.length).toBeGreaterThanOrEqual(2);

    await user.click(toggles[0] as Element);
    expect(onMarkAsKnown).toHaveBeenCalledWith(0);

    await user.click(toggles[1] as Element);
    expect(onMarkAsImportant).toHaveBeenCalledWith(0);
  });

  it("scrolls to chapter when a chapter row is clicked", async () => {
    const user = userEvent.setup();

    // Prepare target element the component will try to scroll to
    const targetId = encodeURIComponent(baseContent.chapters[1].name);
    const target = document.createElement("div");
    target.id = targetId;
    target.scrollIntoView = jest.fn();
    document.body.appendChild(target);

    render(
      <TableOfContents
        content={baseContent as any}
        onMarkAsKnown={jest.fn()}
        onMarkAsImportant={jest.fn()}
      />
    );

    const chapterButton = screen.getByRole("button", {
      name: baseContent.chapters[1].name,
    });
    await user.click(chapterButton);

    expect(target.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "smooth", block: "start" })
    );

    document.body.removeChild(target);
  });

  it("handles empty data without crashing (fallback)", () => {
    render(
      <TableOfContents
        content={{ chapters: [] } as any}
        onMarkAsKnown={jest.fn()}
        onMarkAsImportant={jest.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: /table of contents/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/0 of 0 chapters marked as known/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/0 of 0 chapters marked as important/i)
    ).toBeInTheDocument();

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});

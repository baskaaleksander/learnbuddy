import React from "react";
import { render, screen, waitFor } from "@/__tests__/utils/test-utils";
import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MaterialFlashcards from "@/components/features/material/material-flashcards";
import { fetchGraphQL } from "@/utils/gql-axios";
import { toast } from "sonner";

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

jest.mock("sonner", () => {
  const t = Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn() });
  return { toast: t };
});

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return {
    ...actual,
    useAuth: () => ({
      getUserTokens: jest
        .fn()
        .mockResolvedValue({ tokensLimit: 10, tokensUsed: 0 }),
    }),
  };
});

const mockToast = toast as jest.Mocked<typeof toast>;

jest.mock("@/utils/gql-axios", () => ({
  fetchGraphQL: jest.fn(),
}));

describe("Material Flashcards", () => {
  const id = "mat-123";
  const stats = {
    aiOutputId: "ai-1",
    total: 10,
    known: 7,
    review: 3,
    lastUpdated: "2024-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and render flashcard stats for a material", async () => {
    (fetchGraphQL as jest.Mock).mockResolvedValueOnce({
      getFlashcardStatsByMaterial: stats,
    });

    render(<MaterialFlashcards id={id} onAssetChange={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(String(stats.known))).toBeInTheDocument();
      expect(screen.getByText(String(stats.review))).toBeInTheDocument();
      expect(screen.getByText(String(stats.total))).toBeInTheDocument();
      expect(screen.getByText(/knowledge rate/i)).toBeInTheDocument();
    });

    const percent = Math.round((stats.known / stats.total) * 100) + "%";
    expect(screen.getByText(percent)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /flashcards/i });
    expect(link).toHaveAttribute(
      "href",
      `/dashboard/flashcards/${stats.aiOutputId}`
    );
  });

  it("should show loading state while fetching", async () => {
    let resolveFn: Function = () => {};
    (fetchGraphQL as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => (resolveFn = resolve))
    );

    render(<MaterialFlashcards id={id} onAssetChange={jest.fn()} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    resolveFn({ getFlashcardStatsByMaterial: stats });

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  it("should display error message if fetch fails", async () => {
    (fetchGraphQL as jest.Mock).mockRejectedValueOnce(new Error("boom"));

    render(<MaterialFlashcards id={id} onAssetChange={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to fetch quizzes\. please try again later\./i)
      ).toBeInTheDocument();
    });
  });

  it("should open and close generate dialog", async () => {
    (fetchGraphQL as jest.Mock).mockResolvedValue({
      getFlashcardStatsByMaterial: { ...stats, total: 0 },
    });

    render(<MaterialFlashcards id={id} onAssetChange={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText(/no flashcards available for this material/i)
      ).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const openBtn = screen.getByRole("button", { name: /generate/i });
    await user.click(openBtn);

    await screen.findByRole("heading", { name: /generate\s+flashcards/i });

    const cancel = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancel);

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: /generate\s+flashcards/i })
      ).not.toBeInTheDocument();
    });
  });

  it("should handle flashcards deletion flow and show toast", async () => {
    (fetchGraphQL as jest.Mock)
      .mockResolvedValueOnce({ getFlashcardStatsByMaterial: stats })
      .mockResolvedValueOnce({ deleteFlashcard: true });

    const onAssetChange = jest.fn();
    render(<MaterialFlashcards id={id} onAssetChange={onAssetChange} />);

    await waitFor(() => {
      expect(screen.getByText(String(stats.total))).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const delBtn = screen.getByRole("button", { name: /delete/i });
    await user.click(delBtn);
    const dialog = await screen.findByRole("dialog");
    const confirmDelete = within(dialog).getByRole("button", {
      name: /^delete$/i,
    });
    await user.click(confirmDelete);

    await waitFor(() => {
      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining(`deleteFlashcard(id: "${id}")`)
      );
    });
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        "Flashcards deleted successfully.",
        expect.objectContaining({ icon: expect.any(Object) })
      );
      expect(onAssetChange).toHaveBeenCalledTimes(1);
    });
  });

  it("should handle flashcards regeneration", async () => {
    (fetchGraphQL as jest.Mock)
      .mockResolvedValueOnce({ getFlashcardStatsByMaterial: stats })
      .mockResolvedValueOnce({ regenerateFlashcards: true });

    const onAssetChange = jest.fn();
    render(<MaterialFlashcards id={id} onAssetChange={onAssetChange} />);

    await waitFor(() => {
      expect(screen.getByText(String(stats.total))).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const regenBtn = screen.getByRole("button", { name: /regenerate/i });
    await user.click(regenBtn);

    const regenDialog = await screen.findByRole("dialog");
    const confirmRegen = within(regenDialog).getByRole("button", {
      name: /^regenerate$/i,
    });
    await user.click(confirmRegen);

    await waitFor(() => {
      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining(`regenerateFlashcards(materialId: "${id}")`)
      );
      expect(mockToast.success).toHaveBeenCalledWith(
        "Flashcards regenerated successfully.",
        expect.objectContaining({ icon: expect.any(Object) })
      );
      expect(onAssetChange).toHaveBeenCalledTimes(1);
    });
  });
});

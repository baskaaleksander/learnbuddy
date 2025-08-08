import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import FlashcardCard from "@/components/features/flashcards/flashcard-card";
import {
  createMockFlashcard,
  mockMatchMedia,
} from "@/__tests__/utils/test-utils";
import { fetchGraphQL } from "@/utils/gql-axios";
import { toast } from "sonner";
import { FlashcardData } from "@/lib/definitions";

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

const toastFn: any = jest.fn();
toastFn.error = jest.fn();
jest.mock("sonner", () => ({
  toast: toastFn,
}));

describe("Flashcard Card", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMatchMedia(true);
  });

  const makeFC = (overrides: Partial<FlashcardData> = {}): FlashcardData =>
    ({
      ...createMockFlashcard(),
      lastUpdated: "2024-01-02T00:00:00.000Z",
      ...overrides,
    } as FlashcardData);

  const openDropdown = async () => {
    const trigger = screen.getByRole("button", { name: /open menu/i });
    await userEvent.click(trigger);
  };

  const openDeleteDialogViaMenu = async () => {
    await openDropdown();
    const deleteItem = await screen.findByText(/delete/i);
    await userEvent.click(deleteItem);
  };

  it("should render flashcard card without crashing", () => {
    render(<FlashcardCard flashcardData={makeFC()} />);

    expect(screen.getByText(/created/i)).toBeInTheDocument();
    expect(screen.getByText(/click to view/i)).toBeInTheDocument();
  });

  it("should display counts and related material", () => {
    const data = makeFC({
      known: 5,
      review: 3,
      total: 8,
      material: { id: "m1", title: "Algebra Basics" },
    });

    render(<FlashcardCard flashcardData={data} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText(/knowledge rate/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /algebra basics/i })
    ).toBeInTheDocument();
  });

  it("should indicate when flashcard needs attention (knowledge < 60%)", () => {
    const data = makeFC({ known: 3, total: 10 });
    render(<FlashcardCard flashcardData={data} />);

    expect(
      document.querySelectorAll(".lucide-alert-triangle").length
    ).toBeGreaterThan(0);
    expect(screen.getByText(/needs attention/i)).toBeInTheDocument();
  });

  it("should call onFlashcardDeleted after successful deletion", async () => {
    const onDeleted = jest.fn();
    (fetchGraphQL as jest.Mock).mockResolvedValueOnce({
      data: { deleteFlashcard: true },
    });

    render(
      <FlashcardCard flashcardData={makeFC()} onFlashcardDeleted={onDeleted} />
    );

    await openDeleteDialogViaMenu();

    const confirmDelete = screen.getByRole("button", { name: /^delete$/i });
    await userEvent.click(confirmDelete);

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalledTimes(1);
    });
  });

  it("should show and hide dropdown menu on trigger", async () => {
    render(<FlashcardCard flashcardData={makeFC()} />);

    await openDropdown();
    expect(await screen.findByText(/delete/i)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByText(/delete/i)).not.toBeInTheDocument();
    });
  });

  it("should open and close delete dialog", async () => {
    render(<FlashcardCard flashcardData={makeFC()} />);

    await openDeleteDialogViaMenu();
    expect(screen.getByText(/delete flashcard set/i)).toBeInTheDocument();

    const cancel = screen.getByRole("button", { name: /cancel/i });
    await userEvent.click(cancel);

    await waitFor(() => {
      expect(
        screen.queryByText(/delete flashcard set/i)
      ).not.toBeInTheDocument();
    });
  });

  it("should call handleDeleteFlashcards and show toast on successful deletion", async () => {
    (fetchGraphQL as jest.Mock).mockResolvedValueOnce({
      data: { deleteFlashcard: true },
    });

    render(<FlashcardCard flashcardData={makeFC()} />);

    await openDeleteDialogViaMenu();
    const confirmDelete = screen.getByRole("button", { name: /^delete$/i });
    await userEvent.click(confirmDelete);

    await waitFor(() => {
      expect((toast as any).success).toHaveBeenCalledWith(
        "Flashcards deleted successfully.",
        expect.objectContaining({ icon: expect.any(Object) })
      );
    });
  });

  it("should show error toast on failed deletion", async () => {
    (fetchGraphQL as jest.Mock).mockRejectedValueOnce(
      new Error("Network error")
    );

    render(<FlashcardCard flashcardData={makeFC()} />);

    await openDeleteDialogViaMenu();
    const confirmDelete = screen.getByRole("button", { name: /^delete$/i });
    await userEvent.click(confirmDelete);

    await waitFor(() => {
      expect((toast as any).error).toHaveBeenCalledWith(
        "Failed to delete flashcards. Please try again later."
      );
    });
  });

  it("should redirect to material page when material is clicked", async () => {
    const data = makeFC({ material: { id: "mat-42", title: "Biology" } });
    render(<FlashcardCard flashcardData={data} />);

    const originalHref = window.location.href;
    const materialBtn = screen.getByRole("button", { name: /biology/i });
    await userEvent.click(materialBtn);

    expect(window.location.href).toContain(
      `/dashboard/materials/${data.material.id}`
    );
    window.history.pushState({}, "", originalHref);
  });

  it("should highlight card border when attention needed", () => {
    const data = makeFC({ known: 1, total: 10 });
    render(<FlashcardCard flashcardData={data} />);

    const redBorderEls = Array.from(
      document.querySelectorAll(".border-red-500")
    );
    expect(redBorderEls.length).toBeGreaterThan(0);
  });

  it("should handle rapid open/close of dropdown and dialog", async () => {
    render(<FlashcardCard flashcardData={makeFC()} />);

    await openDropdown();
    fireEvent.keyDown(document, { key: "Escape" });
    await openDropdown();

    const deleteItem = await screen.findByText(/delete/i);
    await userEvent.click(deleteItem);
    expect(screen.getByText(/delete flashcard set/i)).toBeInTheDocument();

    const cancel = screen.getByRole("button", { name: /cancel/i });
    await userEvent.click(cancel);

    await waitFor(() => {
      expect(
        screen.queryByText(/delete flashcard set/i)
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/delete$/i)).not.toBeInTheDocument();
    });
  });
});

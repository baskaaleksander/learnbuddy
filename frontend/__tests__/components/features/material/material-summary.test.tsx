import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "@/__tests__/utils/test-utils";
import { fetchGraphQL } from "@/utils/gql-axios";
import api from "@/utils/axios";
import { toast } from "sonner";

jest.mock("@/utils/gql-axios", () => ({
  fetchGraphQL: jest.fn(),
}));

const mockToast = toast as jest.Mocked<typeof toast>;

jest.mock("@/utils/axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

jest.mock("@/components/common/generate-asset", () => ({
  GenerateAssetDialog: ({
    onGenerateAction,
    triggerText = "Generate",
  }: any) => (
    <div>
      <button onClick={onGenerateAction}>
        {triggerText === "Regenerate" ? "Regenerate" : "Generate summary"}
      </button>
      <button data-testid="cancel-button">Cancel</button>
    </div>
  ),
}));

jest.mock("@/components/common/delete-asset-dialog", () => ({
  __esModule: true,
  default: ({ onDeleteAction }: any) => (
    <button onClick={onDeleteAction}>Delete</button>
  ),
}));

import MaterialSummary from "@/components/features/material/material-summary";

describe("Material Summary", () => {
  const materialId = "mat-1";
  const onAssetChange = jest.fn();

  const mockSummary = {
    id: "sum-1",
    createdAt: "2024-01-02T00:00:00.000Z",
    content: {
      title: "Algebra Basics",
      chapters: [
        {
          name: "Introduction",
          bullet_points: [
            "What is algebra?",
            "Variables and constants",
            "Expressions",
            "Equations",
          ],
        },
        {
          name: "Operations",
          bullet_points: ["Addition", "Subtraction", "Multiplication"],
        },
        {
          name: "Advanced",
          bullet_points: ["Polynomials"],
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({ data: null });
  });

  it("should fetch and render summary data for a material", async () => {
    (fetchGraphQL as jest.Mock).mockResolvedValue({
      getSummaryByMaterial: mockSummary,
    });

    render(<MaterialSummary id={materialId} onAssetChange={onAssetChange} />);

    expect(screen.getByText(/loading summary/i)).toBeInTheDocument();

    expect(await screen.findByText("Algebra Basics")).toBeInTheDocument();
    expect(screen.getByText("Introduction")).toBeInTheDocument();

    expect(screen.getByText(/variables and constants/i)).toBeInTheDocument();
    expect(screen.getByText(/\+1 more points/i)).toBeInTheDocument();

    expect(screen.getByText(/\+1 more chapter/i)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /view full summary/i });
    expect(link).toHaveAttribute(
      "href",
      `/dashboard/summaries/${mockSummary.id}`
    );
  });

  it("should show loading state while fetching", async () => {
    let resolveFn: (v?: any) => void;
    const pending = new Promise((resolve) => (resolveFn = resolve));
    (fetchGraphQL as jest.Mock).mockReturnValue(pending);

    render(<MaterialSummary id={materialId} onAssetChange={onAssetChange} />);

    expect(screen.getByText(/loading summary/i)).toBeInTheDocument();

    resolveFn!({ getSummaryByMaterial: null });
    await waitFor(() =>
      expect(
        screen.getByText(/no summary available for this material/i)
      ).toBeInTheDocument()
    );
  });

  it("should display error message if fetch fails", async () => {
    (fetchGraphQL as jest.Mock).mockRejectedValue(new Error("Network error"));

    render(<MaterialSummary id={materialId} onAssetChange={onAssetChange} />);

    expect(
      await screen.findByText(/failed to fetch summary/i)
    ).toBeInTheDocument();
  });

  it("should open and close generate dialog", async () => {
    (fetchGraphQL as jest.Mock).mockResolvedValueOnce({
      getSummaryByMaterial: null,
    });

    render(<MaterialSummary id={materialId} onAssetChange={onAssetChange} />);

    expect(
      await screen.findByText(/no summary available for this material/i)
    ).toBeInTheDocument();

    const confirm = screen.getByRole("button", { name: /generate summary/i });
    expect(confirm).toBeInTheDocument();
    const cancel = screen.getByTestId("cancel-button");
    fireEvent.click(cancel);
    expect(cancel).toBeInTheDocument();
  });

  it("should handle summary generation and show toast", async () => {
    (fetchGraphQL as jest.Mock)
      .mockResolvedValueOnce({ getSummaryByMaterial: null })
      .mockResolvedValueOnce({ createSummary: true });

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "/auth/me") return Promise.resolve({ data: null });
      if (url === "/billing/get-user-tokens")
        return Promise.resolve({ data: { tokensLimit: 10, tokensUsed: 0 } });
      return Promise.resolve({ data: null });
    });

    const onAssetChange = jest.fn();
    render(<MaterialSummary id={materialId} onAssetChange={onAssetChange} />);

    const confirm = await screen.findByRole("button", {
      name: /generate summary/i,
    });
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(
        (fetchGraphQL as jest.Mock).mock.calls.some(([q]) =>
          String(q).includes("mutation CreateSummary")
        )
      ).toBe(true);
      expect(mockToast.success).toHaveBeenCalledWith(
        "Summary generated successfully",
        expect.objectContaining({ icon: expect.any(Object) })
      );
      expect(onAssetChange).toHaveBeenCalledTimes(1);
    });
  });

  it("should handle summary deletion", async () => {
    (fetchGraphQL as jest.Mock)
      .mockResolvedValueOnce({ getSummaryByMaterial: mockSummary })
      .mockResolvedValueOnce({ deleteSummary: true });

    render(<MaterialSummary id={materialId} onAssetChange={onAssetChange} />);

    const deleteButtons = await screen.findAllByRole("button", {
      name: /^delete$/i,
    });
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining("mutation DeleteSummary")
      );
    });

    expect(onAssetChange).toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalledWith(
      "Summary deleted successfully",
      expect.objectContaining({ icon: expect.any(Object) })
    );
  });

  it("should fetch and display user tokens", async () => {
    (fetchGraphQL as jest.Mock).mockResolvedValueOnce({
      getSummaryByMaterial: null,
    });
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: { tokensLimit: 1, tokensUsed: 0 } });

    render(<MaterialSummary id={materialId} onAssetChange={onAssetChange} />);

    await waitFor(() => {
      expect(api.get as jest.Mock).toHaveBeenCalledWith(
        "/billing/get-user-tokens"
      );
    });

    expect(
      await screen.findByRole("button", { name: /generate summary/i })
    ).toBeInTheDocument();
  });
});

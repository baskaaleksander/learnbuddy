import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { fetchGraphQL } from "@/utils/gql-axios";
import SecondStepUpload from "@/components/features/material/second-step-upload";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/utils/gql-axios", () => ({
  fetchGraphQL: jest.fn(),
}));

describe("Second Step Upload", () => {
  const mockPush = jest.fn();
  const materialId = "upload-123";

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it("should render the second step upload form", () => {
    render(<SecondStepUpload id={materialId} />);

    expect(screen.getByText(/upload material/i)).toBeInTheDocument();
    expect(
      screen.getByText(/finish uploading your material/i)
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText(/title/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /finish/i })).toBeInTheDocument();
  });

  it("should validate required title field", async () => {
    render(<SecondStepUpload id={materialId} />);

    const submitBtn = screen.getByRole("button", { name: /finish/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchGraphQL).not.toHaveBeenCalled();
    });
  });

  it("should show error if API call fails", async () => {
    (fetchGraphQL as jest.Mock).mockRejectedValueOnce(new Error("Network"));

    render(<SecondStepUpload id={materialId} />);

    fireEvent.change(screen.getByPlaceholderText(/title/i), {
      target: { value: "My Title" },
    });

    const submitBtn = screen.getByRole("button", { name: /finish/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/an error occurred while uploading the material/i)
    ).toBeInTheDocument();

    expect(submitBtn).not.toBeDisabled();
  });

  it("should show success message and redirect on successful upload", async () => {
    jest.useFakeTimers();
    (fetchGraphQL as jest.Mock).mockResolvedValueOnce({
      createMaterial: { id: materialId, title: "My Title", description: "" },
    });

    render(<SecondStepUpload id={materialId} />);

    fireEvent.change(screen.getByPlaceholderText(/title/i), {
      target: { value: "My Title" },
    });
    fireEvent.change(screen.getByPlaceholderText(/description/i), {
      target: { value: "Desc" },
    });

    fireEvent.click(screen.getByRole("button", { name: /finish/i }));

    expect(
      await screen.findByText(/material uploaded successfully/i)
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/dashboard/materials")
    );
    jest.useRealTimers();
  });

  it("should handle loading state during submission", async () => {
    let resolveFn: (v?: unknown) => void;
    const pending = new Promise((resolve) => {
      resolveFn = resolve;
    });
    (fetchGraphQL as jest.Mock).mockReturnValueOnce(pending);

    render(<SecondStepUpload id={materialId} />);

    fireEvent.change(screen.getByPlaceholderText(/title/i), {
      target: { value: "My Title" },
    });

    const btn = screen.getByRole("button", { name: /finish/i });
    fireEvent.click(btn);

    expect(
      await screen.findByRole("button", { name: /please wait/i })
    ).toBeDisabled();

    resolveFn!({ createMaterial: { id: materialId } });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /finish/i })
      ).not.toBeDisabled();
    });
  });
});

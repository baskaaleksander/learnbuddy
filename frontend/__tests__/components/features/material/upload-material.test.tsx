import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import api from "@/utils/axios";
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter() {
    return {
      push: pushMock,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

jest.mock("pdfmake/build/vfs_fonts", () => ({
  __esModule: true,
  default: { vfs: {} },
}));

const getBlobMock = (cb: (b: Blob) => void) =>
  cb(new Blob(["dummy"], { type: "application/pdf" }));

jest.mock("pdfmake/build/pdfmake", () => ({
  __esModule: true,
  default: {
    vfs: {},
    createPdf: jest.fn(() => ({ getBlob: getBlobMock })),
  },
}));

import UploadMaterial from "@/components/features/material/upload-material";

describe("Upload Material", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        email: "test@example.com",
        id: "1",
        role: "user",
        firstName: "Test",
        tokensUsed: 0,
      },
    });
    pushMock.mockReset();
  });

  it("should render upload material form", async () => {
    render(<UploadMaterial />);
    expect(await screen.findByText(/upload material/i)).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /upload pdf/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /paste text/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue/i })
    ).toBeInTheDocument();
  });

  it("should validate that either PDF or text content is provided", async () => {
    render(<UploadMaterial />);
    await userEvent.click(screen.getByRole("tab", { name: /paste text/i }));
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      await screen.findByText(/either upload a pdf or enter text/i)
    ).toBeInTheDocument();
  });

  it("should display error for invalid file type", async () => {
    render(<UploadMaterial />);
    const input = document.getElementById("file-upload") as HTMLInputElement;
    const badFile = new File(["hello"], "notes.txt", { type: "text/plain" });
    await waitFor(() =>
      fireEvent.change(input, { target: { files: [badFile] } })
    );
    expect(
      await screen.findByText(/only pdf files are allowed/i)
    ).toBeInTheDocument();
  });

  it("should handle file drop and select events", async () => {
    render(<UploadMaterial />);

    const dropZone = screen
      .getByText(/drop your file here, or click to browse/i)
      .closest("div") as HTMLElement;
    const pdf = new File(["%PDF"], "doc.pdf", { type: "application/pdf" });
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [pdf],
        types: ["Files"],
        getData: () => "",
        setData: () => {},
      },
    });
    expect(await screen.findByText(/doc\.pdf/i)).toBeInTheDocument();

    const input = document.getElementById("file-upload") as HTMLInputElement;
    const pdf2 = new File(["%PDF"], "another.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [pdf2] } });
    expect(await screen.findByText(/another\.pdf/i)).toBeInTheDocument();
  });

  it("should show uploading state and success message on upload", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { materialId: "999" },
    });

    render(<UploadMaterial />);

    const input = document.getElementById("file-upload") as HTMLInputElement;
    const pdf = new File(["%PDF"], "doc.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [pdf] } });

    await userEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/material uploaded successfully/i)
      ).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/dashboard/materials/upload/123")
    );
  });

  it("should show error message on upload failure", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        email: "test@example.com",
        id: "1",
        role: "user",
        firstName: "Test",
        tokensUsed: 0,
      },
    });
    let rejectPost: (e: any) => void;
    const pending = new Promise((_, reject) => {
      rejectPost = reject;
    });
    (api.post as jest.Mock).mockReturnValueOnce(pending);

    render(<UploadMaterial />);

    const input = document.getElementById("file-upload") as HTMLInputElement;
    const pdf = new File(["%PDF"], "doc.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [pdf] } });

    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    rejectPost!(new Error("Upload failed"));
    expect(await screen.findByText(/upload failed/i)).toBeInTheDocument();
  });

  it("should call API for uploading PDF", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { materialId: "999" },
    });

    render(<UploadMaterial />);

    const input = document.getElementById("file-upload") as HTMLInputElement;
    const pdf = new File(["%PDF"], "doc.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [pdf] } });

    await userEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    const [, formData] = (api.post as jest.Mock).mock.calls[0];
    expect(formData).toBeInstanceOf(FormData);
    const uploaded = (formData as FormData).get("file") as File;
    expect(uploaded).toBeInstanceOf(File);
    expect(uploaded.name).toBe("doc.pdf");
  });

  it("should call API for uploading text content", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { materialId: "321" },
    });

    render(<UploadMaterial />);

    await userEvent.click(screen.getByRole("tab", { name: /paste text/i }));
    const textarea = screen.getByPlaceholderText(
      /paste or type your content here/i
    );
    await userEvent.type(textarea, "Some study notes");

    await userEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    const [, formData] = (api.post as jest.Mock).mock.calls[0];
    const uploaded = (formData as FormData).get("file") as File;
    expect(uploaded).toBeInstanceOf(File);
    expect(uploaded.type).toBe("application/pdf");
    expect(uploaded.name).toMatch(/\.pdf$/);
  });

  it("should redirect to login if user is not authenticated", async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error("Not auth"));
    render(<UploadMaterial />);
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import UploadMaterial from "@/components/features/material/upload-material";
import api from "@/utils/axios";
import pdfMake from "pdfmake/build/pdfmake";

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("pdfmake/build/pdfmake", () => ({
  __esModule: true,
  default: {
    vfs: {},
    createPdf: jest.fn(() => ({
      getBlob: (cb: (b: Blob) => void) =>
        cb(new Blob(["pdf"], { type: "application/pdf" })),
    })),
  },
}));

jest.mock("pdfmake/build/vfs_fonts", () => ({
  __esModule: true,
  default: { vfs: {} },
}));

jest.mock("@/providers/auth-provider", () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

import { useAuth } from "@/providers/auth-provider";

describe("Upload Material", () => {
  const mockUser = {
    id: "1",
    email: "user@example.com",
    firstName: "User",
    role: "user",
    tokensUsed: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser, loading: false });
    (api.get as jest.Mock).mockResolvedValue({ data: null });
    (api.post as jest.Mock).mockResolvedValue({
      data: { materialId: "upload-1" },
    });
  });

  it("renders core UI elements", () => {
    render(<UploadMaterial />);

    expect(screen.getByText(/upload material/i)).toBeInTheDocument();
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

  it("triggers hidden file input when drop area is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<UploadMaterial />);

    const input = container.querySelector("#file-upload") as HTMLInputElement;
    const clickSpy = jest.spyOn(input, "click");

    const dropCta = screen.getByText(
      /drop your file here, or click to browse/i
    );
    await user.click(dropCta);

    expect(clickSpy).toHaveBeenCalled();
  });

  it("accepts PDF file and shows filename", async () => {
    const { container } = render(<UploadMaterial />);

    const input = container.querySelector("#file-upload") as HTMLInputElement;
    const file = new File(["%PDF-1.4"], "doc.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText("doc.pdf")).toBeInTheDocument();
  });

  it("shows error for non-PDF file", async () => {
    const { container } = render(<UploadMaterial />);
    const input = container.querySelector("#file-upload") as HTMLInputElement;
    const file = new File(["hello"], "note.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(
      await screen.findByText(/only pdf files are allowed/i)
    ).toBeInTheDocument();
  });

  it("shows fallback error when submitting with no file or text", async () => {
    render(<UploadMaterial />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /paste text/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(
      await screen.findByText(/either upload a pdf or enter text/i)
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("generates PDF from text using user email and uploads", async () => {
    render(<UploadMaterial />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /paste text/i }));

    const textarea = await screen.findByPlaceholderText(
      /paste or type your content here/i
    );
    fireEvent.change(textarea, { target: { value: "Hello world" } });

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect((pdfMake as any).createPdf).toHaveBeenCalled();
      expect(api.post).toHaveBeenCalledWith("/upload/", expect.any(FormData));
    });

    const docDef = (pdfMake as any).createPdf.mock.calls[0][0];
    expect(docDef.info.author).toBe(mockUser.email);

    const formDataArg = (api.post as jest.Mock).mock.calls[0][1] as FormData;
    const file = formDataArg.get("file") as File;
    expect(file).toBeInstanceOf(File);
    expect(file.name).toContain(mockUser.email);

    expect(
      await screen.findByText(/material uploaded successfully/i)
    ).toBeInTheDocument();
  });

  it("uploads selected PDF file and redirects", async () => {
    jest.useFakeTimers();
    const { container } = render(<UploadMaterial />);
    const input = container.querySelector("#file-upload") as HTMLInputElement;
    const file = new File(["%PDF-1.7"], "lesson.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/upload/", expect.any(FormData));
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/dashboard/materials/upload/upload-1"
      );
    });
    jest.useRealTimers();
  });

  it("redirects to login when unauthenticated", () => {
    (useAuth as jest.Mock).mockReturnValueOnce({ user: null, loading: false });
    render(<UploadMaterial />);
    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});

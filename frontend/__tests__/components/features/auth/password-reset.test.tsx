import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@/__tests__/utils/test-utils";
import { useRouter } from "next/navigation";
import ResetPasswordForm from "@/components/features/auth/reset-password-form";
import api from "@/utils/axios";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

const PasswordResetRequestForm = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/request-password-reset", { email });
      setSuccess("Password reset link sent to your email.");
    } catch (error: any) {
      setError(error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="email"
        type="email"
        placeholder="Enter your email"
        aria-label="Email"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Loading..." : "Request Password Reset"}
      </button>
      {error && <div data-testid="error">{error}</div>}
      {success && <div data-testid="success">{success}</div>}
    </form>
  );
};

describe("Password Reset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe("Password Reset Request", () => {
    it("should successfully request password reset", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      mockApi.post.mockResolvedValueOnce({ data: { success: true } });

      render(<PasswordResetRequestForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", {
        name: /request password reset/i,
      });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId("success")).toHaveTextContent(
          "Password reset link sent to your email."
        );
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        "/auth/request-password-reset",
        {
          email: "test@example.com",
        }
      );
    });

    it("should show error for invalid email", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      mockApi.post.mockRejectedValueOnce({
        response: {
          data: { message: "Email not found" },
        },
      });

      render(<PasswordResetRequestForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", {
        name: /request password reset/i,
      });

      fireEvent.change(emailInput, {
        target: { value: "nonexistent@example.com" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Email not found"
        );
      });
    });

    it("should show loading state during request", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApi.post.mockReturnValueOnce(promise as any);

      render(<PasswordResetRequestForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", {
        name: /request password reset/i,
      });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);

      expect(screen.getByRole("button")).toHaveTextContent("Loading...");
      expect(screen.getByRole("button")).toBeDisabled();

      resolvePromise!({ data: { success: true } });

      await waitFor(() => {
        expect(screen.getByTestId("success")).toBeInTheDocument();
      });
    });
  });

  describe("Password Reset with Token", () => {
    const mockToken = "valid-reset-token";

    it("should successfully reset password with valid token", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      mockApi.post.mockResolvedValueOnce({ data: { success: true } });

      render(<ResetPasswordForm token={mockToken} />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /change password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "newpassword123" },
      });
      fireEvent.click(submitButton);

      // Should redirect to login after success
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        `/auth/reset-password/${mockToken}`,
        {
          password: "newpassword123",
        }
      );
    });

    it("should show validation errors for password mismatch", async () => {
      render(<ResetPasswordForm token={mockToken} />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /change password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "different123" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
    });

    it("should show validation errors for short password", async () => {
      render(<ResetPasswordForm token={mockToken} />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /change password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 6 characters long/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Invalid/Expired Token", () => {
    it("should handle invalid token error", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      mockApi.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: "Invalid or expired token" },
        },
      });

      render(<ResetPasswordForm token="invalid-token" />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /change password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "newpassword123" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });
  });
});

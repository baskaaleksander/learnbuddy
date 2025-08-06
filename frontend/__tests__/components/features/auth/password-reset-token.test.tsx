import React from "react";
import { render, screen, waitFor } from "@/__tests__/utils/test-utils";
import api from "@/utils/axios";

const ResetPasswordTokenPage = ({ token }: { token: string }) => {
  const [message, setMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const verifyToken = async () => {
      try {
        await api.post(`/auth/verify-password-reset-token/${token}`);
        setLoading(false);
      } catch (error: any) {
        if (error.response?.status === 404) {
          setMessage("Invalid or expired token");
        } else {
          setMessage("An error occurred while verifying your token");
        }
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  if (loading) return <div data-testid="loading">Verifying token...</div>;

  return (
    <div>
      {message ? (
        <div data-testid="error-message">{message}</div>
      ) : (
        <div data-testid="reset-form">Password Reset Form</div>
      )}
    </div>
  );
};

describe("Password Reset Token Validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Valid Token", () => {
    it("should show reset form for valid token", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      mockApi.post.mockResolvedValueOnce({ data: { valid: true } });

      render(<ResetPasswordTokenPage token="valid-token" />);

      expect(screen.getByTestId("loading")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId("reset-form")).toBeInTheDocument();
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        "/auth/verify-password-reset-token/valid-token"
      );
    });
  });

  describe("Invalid/Expired Token", () => {
    it("should show error message for invalid token", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      mockApi.post.mockRejectedValueOnce({
        response: { status: 404 },
      });

      render(<ResetPasswordTokenPage token="invalid-token" />);

      expect(screen.getByTestId("loading")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "Invalid or expired token"
        );
      });

      expect(screen.queryByTestId("reset-form")).not.toBeInTheDocument();
    });

    it("should show generic error for server errors", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      mockApi.post.mockRejectedValueOnce({
        response: { status: 500 },
      });

      render(<ResetPasswordTokenPage token="some-token" />);

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "An error occurred while verifying your token"
        );
      });
    });

    it("should show error for expired token", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      mockApi.post.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { message: "Token expired" },
        },
      });

      render(<ResetPasswordTokenPage token="expired-token" />);

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "Invalid or expired token"
        );
      });
    });

    it("should handle network errors during token verification", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      mockApi.post.mockRejectedValueOnce(new Error("Network Error"));

      render(<ResetPasswordTokenPage token="some-token" />);

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "An error occurred while verifying your token"
        );
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading state during token verification", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApi.post.mockReturnValueOnce(promise as any);

      render(<ResetPasswordTokenPage token="token" />);

      expect(screen.getByTestId("loading")).toBeInTheDocument();

      resolvePromise!({ data: { valid: true } });

      await waitFor(() => {
        expect(screen.getByTestId("reset-form")).toBeInTheDocument();
      });

      expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
    });
  });
});

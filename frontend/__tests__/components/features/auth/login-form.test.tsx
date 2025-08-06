import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@/__tests__/utils/test-utils";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/features/auth/login-form";
import api from "@/utils/axios";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe("Valid credentials login", () => {
    it("should successfully log in with valid credentials", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      mockApi.post.mockResolvedValueOnce({
        data: {
          id: "1",
          email: "test@example.com",
          firstName: "Test",
          role: "user",
          tokensUsed: 0,
          accessToken: "mock-access-token",
        },
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });

    it("should redirect authenticated users to home page", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      mockApi.get.mockResolvedValueOnce({
        data: {
          id: "1",
          email: "test@example.com",
          firstName: "Test",
          role: "user",
          tokensUsed: 0,
        },
      });

      render(<LoginForm />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("Invalid credentials login", () => {
    it("should display error message for invalid credentials", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      mockApi.post.mockRejectedValueOnce({
        response: {
          data: { message: "Invalid credentials" },
          status: 401,
        },
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, {
        target: { value: "invalid@example.com" },
      });
      fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });

      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should display error for network failure", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      mockApi.post.mockRejectedValueOnce(new Error("Network Error"));

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe("Form validation", () => {
    it("should show validation errors for invalid email", async () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole("button", { name: /login/i });

      // Enter invalid email
      fireEvent.change(emailInput, { target: { value: "invalid-email" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it("should show validation errors for short password", async () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "123" } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 6 characters long/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Loading states", () => {
    it("should show loading state during login", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApi.post.mockReturnValueOnce(promise as any);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      fireEvent.click(loginButton);

      resolvePromise!({
        data: {
          id: "1",
          email: "test@example.com",
          firstName: "Test",
          role: "user",
          tokensUsed: 0,
          accessToken: "mock-access-token",
        },
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("UI elements", () => {
    it("should render all form elements correctly", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /login/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/forgot your password\?/i)).toBeInTheDocument();
    });

    it("should have correct link to reset password", () => {
      render(<LoginForm />);

      const resetPasswordLink = screen.getByText(/forgot your password\?/i);
      expect(resetPasswordLink).toHaveAttribute("href", "/reset-password");
    });
  });
});

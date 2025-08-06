import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@/__tests__/utils/test-utils";
import { useRouter } from "next/navigation";
import RegisterForm from "@/components/features/auth/register-form";
import api from "@/utils/axios";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

describe("RegisterForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe("Valid registration", () => {
    it("should successfully register with valid information", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      mockApi.post.mockResolvedValueOnce({
        data: {
          id: "1",
          email: "john@example.com",
          firstName: "John",
          role: "user",
          tokensUsed: 0,
          accessToken: "mock-access-token",
        },
      });

      render(<RegisterForm />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const tosCheckbox = screen.getByLabelText(
        /i accept the terms of service/i
      );
      const registerButton = screen.getByRole("button", { name: /register/i });

      fireEvent.change(firstNameInput, { target: { value: "John" } });
      fireEvent.change(emailInput, { target: { value: "john@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });
      fireEvent.click(tosCheckbox);

      fireEvent.click(registerButton);

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

      render(<RegisterForm />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("Registration errors", () => {
    it("should display error message for registration failure", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      mockApi.post.mockRejectedValueOnce({
        response: {
          data: { message: "Email already exists" },
          status: 400,
        },
      });

      render(<RegisterForm />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const tosCheckbox = screen.getByLabelText(
        /i accept the terms of service/i
      );
      const registerButton = screen.getByRole("button", { name: /register/i });

      fireEvent.change(firstNameInput, { target: { value: "John" } });
      fireEvent.change(emailInput, {
        target: { value: "existing@example.com" },
      });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });
      fireEvent.click(tosCheckbox);

      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should display error for network failure", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      mockApi.post.mockRejectedValueOnce(new Error("Network Error"));

      render(<RegisterForm />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const tosCheckbox = screen.getByLabelText(
        /i accept the terms of service/i
      );
      const registerButton = screen.getByRole("button", { name: /register/i });

      fireEvent.change(firstNameInput, { target: { value: "John" } });
      fireEvent.change(emailInput, { target: { value: "john@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });
      fireEvent.click(tosCheckbox);

      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe("Form validation", () => {
    it("should show validation errors for empty first name", async () => {
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const tosCheckbox = screen.getByLabelText(
        /i accept the terms of service/i
      );
      const registerButton = screen.getByRole("button", { name: /register/i });

      fireEvent.change(emailInput, { target: { value: "john@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });
      fireEvent.click(tosCheckbox);
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });
    });

    it("should show validation errors for invalid email", async () => {
      render(<RegisterForm />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const tosCheckbox = screen.getByLabelText(
        /i accept the terms of service/i
      );
      const registerButton = screen.getByRole("button", { name: /register/i });

      fireEvent.change(firstNameInput, { target: { value: "John" } });
      fireEvent.change(emailInput, { target: { value: "invalid-email" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });
      fireEvent.click(tosCheckbox);
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it("should show validation errors for short password", async () => {
      render(<RegisterForm />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const tosCheckbox = screen.getByLabelText(
        /i accept the terms of service/i
      );
      const registerButton = screen.getByRole("button", { name: /register/i });

      fireEvent.change(firstNameInput, { target: { value: "John" } });
      fireEvent.change(emailInput, { target: { value: "john@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "123" } });
      fireEvent.click(tosCheckbox);
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 6 characters long/i)
        ).toBeInTheDocument();
      });
    });

    it("should show validation errors for password mismatch", async () => {
      render(<RegisterForm />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const tosCheckbox = screen.getByLabelText(
        /i accept the terms of service/i
      );
      const registerButton = screen.getByRole("button", { name: /register/i });

      fireEvent.change(firstNameInput, { target: { value: "John" } });
      fireEvent.change(emailInput, { target: { value: "john@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "different123" },
      });
      fireEvent.click(tosCheckbox);
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
    });

    it("should show validation errors for unaccepted terms of service", async () => {
      render(<RegisterForm />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const registerButton = screen.getByRole("button", { name: /register/i });

      fireEvent.change(firstNameInput, { target: { value: "John" } });
      fireEvent.change(emailInput, { target: { value: "john@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });

      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(
          screen.getByText(/you must accept the terms of service/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("UI elements", () => {
    it("should render all form elements correctly", () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/i accept the terms of service/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /register/i })
      ).toBeInTheDocument();
    });

    it("should have password input types set correctly", () => {
      render(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      expect(passwordInput).toHaveAttribute("type", "password");
      expect(confirmPasswordInput).toHaveAttribute("type", "password");
    });
  });
});

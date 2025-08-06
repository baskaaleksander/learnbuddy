import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useAuth } from "@/providers/auth-provider";
import api from "@/utils/axios";

const mockLogout = jest.fn();
const mockUseAuth = {
  user: {
    id: "1",
    email: "test@example.com",
    firstName: "Test",
    role: "user",
    tokensUsed: 0,
  },
  loading: false,
  error: null,
  login: jest.fn(),
  logout: mockLogout,
  register: jest.fn(),
  getUserTokens: jest.fn(),
};

jest.mock("@/providers/auth-provider", () => ({
  useAuth: jest.fn(),
}));

const LogoutTestComponent = () => {
  const { logout, user, loading, error } = useAuth();

  return (
    <div>
      {user && <div data-testid="user-info">Welcome, {user.firstName}</div>}
      {loading && <div data-testid="loading">Loading...</div>}
      {error && <div data-testid="error">{error}</div>}
      <button onClick={logout} data-testid="logout-button">
        Logout
      </button>
    </div>
  );
};

describe("Logout Functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue(mockUseAuth);
  });

  it("should successfully log out user", async () => {
    (api.post as jest.Mock) = jest
      .fn()
      .mockResolvedValueOnce({ data: { success: true } });

    render(<LogoutTestComponent />);

    expect(screen.getByTestId("user-info")).toHaveTextContent("Welcome, Test");

    const logoutButton = screen.getByTestId("logout-button");
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("should handle logout loading state", async () => {
    const mockUseAuthWithLoading = {
      ...mockUseAuth,
      loading: true,
    };
    (useAuth as jest.Mock).mockReturnValue(mockUseAuthWithLoading);

    render(<LogoutTestComponent />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("should handle logout error", async () => {
    const mockUseAuthWithError = {
      ...mockUseAuth,
      error: "Logout failed",
    };
    (useAuth as jest.Mock).mockReturnValue(mockUseAuthWithError);

    render(<LogoutTestComponent />);

    expect(screen.getByTestId("error")).toHaveTextContent("Logout failed");
  });

  it("should clear user data after successful logout", async () => {
    const { rerender } = render(<LogoutTestComponent />);
    expect(screen.getByTestId("user-info")).toBeInTheDocument();

    const mockUseAuthAfterLogout = {
      ...mockUseAuth,
      user: null,
    };
    (useAuth as jest.Mock).mockReturnValue(mockUseAuthAfterLogout);

    rerender(<LogoutTestComponent />);

    expect(screen.queryByTestId("user-info")).not.toBeInTheDocument();
  });
});

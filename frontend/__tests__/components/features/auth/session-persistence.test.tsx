import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AuthProvider } from "@/providers/auth-provider";
import { useAuth } from "@/providers/auth-provider";
import api from "@/utils/axios";

jest.mock("@/utils/axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

const mockStore = {
  accessToken: null as string | null,
  setAccessToken: jest.fn((token: string | null) => {
    mockStore.accessToken = token;
  }),
  clear: jest.fn(() => {
    mockStore.accessToken = null;
  }),
};

jest.mock("@/utils/authStore", () => ({
  useAuthStore: {
    getState: () => mockStore,
    setState: jest.fn(),
    destroy: jest.fn(),
  },
}));

const AuthStateComponent = () => {
  const { user, loading } = useAuth();

  if (loading) return <div data-testid="loading">Loading...</div>;
  if (user)
    return <div data-testid="authenticated">Welcome, {user.firstName}</div>;
  return <div data-testid="unauthenticated">Please log in</div>;
};

describe("Session Persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.accessToken = null;
    mockStore.setAccessToken.mockClear();
    mockStore.clear.mockClear();
    localStorage.clear();
  });

  it("should restore user session on app initialization", async () => {
    mockStore.accessToken = "stored-token";

    const mockApi = api as jest.Mocked<typeof api>;
    mockApi.get
      .mockResolvedValueOnce({
        data: {
          id: "1",
          email: "test@example.com",
          firstName: "Test",
          role: "user",
          tokensUsed: 0,
        },
      })
      .mockResolvedValueOnce({
        data: {
          tokensLimit: 100,
          tokensUsed: 0,
        },
      });

    render(
      <AuthProvider>
        <AuthStateComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent(
        "Welcome, Test"
      );
    });

    expect(mockApi.get).toHaveBeenCalledWith("/auth/me");
  });

  it("should handle invalid stored token", async () => {
    mockStore.accessToken = "invalid-token";

    const mockApi = api as jest.Mocked<typeof api>;
    mockApi.get.mockRejectedValueOnce(new Error("Unauthorized"));

    render(
      <AuthProvider>
        <AuthStateComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("unauthenticated")).toBeInTheDocument();
    });
  });

  it("should handle no stored token", async () => {
    expect(mockStore.accessToken).toBeNull();

    const mockApi = api as jest.Mocked<typeof api>;
    mockApi.get.mockRejectedValueOnce(new Error("No token"));

    render(
      <AuthProvider>
        <AuthStateComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("unauthenticated")).toBeInTheDocument();
    });
  });
});

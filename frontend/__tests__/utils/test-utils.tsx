import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { AuthProvider } from "@/providers/auth-provider";

jest.mock("@/utils/authStore", () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      accessToken: "mock-token",
      setAccessToken: jest.fn(),
      clear: jest.fn(),
    })),
  },
}));

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

jest.mock("@/utils/gql-axios", () => ({
  fetchGraphQL: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: jest.fn(),
  Toaster: ({ children, ...props }: any) => (
    <div data-testid="toaster" {...props}>
      {children}
    </div>
  ),
}));

jest.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: jest.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return <AuthProvider>{children}</AuthProvider>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";

export { customRender as render };

export const createMockUser = (overrides = {}) => ({
  id: "1",
  email: "test@example.com",
  firstName: "Test",
  role: "user",
  tokensUsed: 0,
  ...overrides,
});

export const createMockMaterial = (overrides = {}) => ({
  id: "1",
  title: "Test Material",
  description: "Test description",
  status: "PROCESSED" as const,
  createdAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

export const createMockFlashcard = (overrides = {}) => ({
  id: "1",
  material: createMockMaterial(),
  known: 5,
  review: 3,
  total: 8,
  createdAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

export const createMockQuiz = (overrides = {}) => ({
  id: "1",
  material: createMockMaterial(),
  totalAttempts: 3,
  averagePercentage: 75,
  bestScore: 90,
  latestResult: {
    score: 80,
    completedAt: "2024-01-01T00:00:00.000Z",
  },
  createdAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

export const waitForLoadingToFinish = () => {
  return new Promise((resolve) => setTimeout(resolve, 0));
};

export const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

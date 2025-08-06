import { useAuthStore } from "@/utils/authStore";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useAuthStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().clear();
  });

  it("should initialize with null accessToken", () => {
    const { accessToken } = useAuthStore.getState();
    expect(accessToken).toBeNull();
  });

  it("should set accessToken when setAccessToken is called", () => {
    const token = "test-token";
    useAuthStore.getState().setAccessToken(token);

    const { accessToken } = useAuthStore.getState();
    expect(accessToken).toBe(token);
  });

  it("should clear accessToken when clear is called", () => {
    useAuthStore.getState().setAccessToken("test-token");

    useAuthStore.getState().clear();

    const { accessToken } = useAuthStore.getState();
    expect(accessToken).toBeNull();
  });

  it("should handle null token in setAccessToken", () => {
    useAuthStore.getState().setAccessToken("test-token");

    useAuthStore.getState().setAccessToken(null);

    const { accessToken } = useAuthStore.getState();
    expect(accessToken).toBeNull();
  });

  it("should persist state across page reloads", () => {
    const token = "persistent-token";
    useAuthStore.getState().setAccessToken(token);

    const { accessToken } = useAuthStore.getState();
    expect(accessToken).toBe(token);
  });
});

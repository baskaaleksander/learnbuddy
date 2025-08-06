import { renderHook } from "@testing-library/react";
import useMediaQuery from "@/app/hooks/use-media-query";

describe("useMediaQuery", () => {
  const mockMatchMedia = (matches: boolean) => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true when media query matches", () => {
    mockMatchMedia(true);

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

    expect(result.current).toBe(true);
  });

  it("should return false when media query does not match", () => {
    mockMatchMedia(false);

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

    expect(result.current).toBe(false);
  });

  it("should work with different media query strings", () => {
    mockMatchMedia(true);

    const queries = [
      "(min-width: 768px)",
      "(max-width: 1024px)",
      "(prefers-color-scheme: dark)",
      "(orientation: landscape)",
    ];

    queries.forEach((query) => {
      const { result } = renderHook(() => useMediaQuery(query));
      expect(result.current).toBe(true);
    });
  });

  it("should update state when media query changes", () => {
    let mockListener: ((event: any) => void) | null = null;

    const mockMatchMediaInstance = {
      matches: false,
      media: "(min-width: 768px)",
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event, listener) => {
        mockListener = listener;
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockReturnValue(mockMatchMediaInstance),
    });

    const { result, rerender } = renderHook(() =>
      useMediaQuery("(min-width: 768px)")
    );

    expect(result.current).toBe(false);

    if (mockListener) {
      mockListener({ matches: true });
    }

    rerender();

    expect(result.current).toBe(true);
  });

  it("should clean up event listeners on unmount", () => {
    const mockRemoveEventListener = jest.fn();
    const mockMatchMediaInstance = {
      matches: false,
      media: "(min-width: 768px)",
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: mockRemoveEventListener,
      dispatchEvent: jest.fn(),
    };

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockReturnValue(mockMatchMediaInstance),
    });

    const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalled();
  });
});

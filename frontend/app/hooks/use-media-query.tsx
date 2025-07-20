import { useState, useEffect } from "react";

/**
 * Custom hook that returns a boolean indicating if the provided media query matches.
 *
 * @param query - The media query string to check against
 * @returns boolean that indicates if the media query matches
 *
 * @example
 * // Check if viewport is at least medium size
 * const isMediumScreen = useMediaQuery('(min-width: 768px)');
 *
 * // Check if user prefers dark mode
 * const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 */
function useMediaQuery(query: string): boolean {
  // Initialize state with the current match value or false on the server
  const [matches, setMatches] = useState<boolean>(() => {
    // Check if window is defined (client-side)
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    // Return early if window is not defined (SSR)
    if (typeof window === "undefined") {
      return;
    }

    const mediaQueryList = window.matchMedia(query);

    // Update the state initially
    setMatches(mediaQueryList.matches);

    // Define listener function
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers - addEventListener
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", listener);
      return () => {
        mediaQueryList.removeEventListener("change", listener);
      };
    }
    // Legacy browsers - addListener (deprecated but included for backwards compatibility)
    else {
      // @ts-expect-error - Using deprecated API for older browsers
      mediaQueryList.addListener(listener);
      return () => {
        // @ts-expect-error - Using deprecated API for older browsers
        mediaQueryList.removeListener(listener);
      };
    }
  }, [query]);

  return matches;
}

export default useMediaQuery;

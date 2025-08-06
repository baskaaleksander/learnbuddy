import { formatDate } from "@/utils/format-date";

describe("formatDate", () => {
  it("should format date string to MM DD, YYYY format", () => {
    const dateString = "2024-01-15T10:30:00.000Z";
    const formatted = formatDate(dateString);
    expect(formatted).toBe("Jan 15, 2024");
  });

  it("should handle different date formats consistently", () => {
    const dates = [
      "2024-01-15T10:30:00.000Z",
      "2024-01-15",
      "2024-01-15T00:00:00.000Z",
    ];

    dates.forEach((dateString) => {
      const formatted = formatDate(dateString);
      expect(formatted).toBe("Jan 15, 2024");
    });
  });

  it("should return formatted date for valid ISO date strings", () => {
    const testCases = [
      { input: "2024-12-25T00:00:00.000Z", expected: "Dec 25, 2024" },
      { input: "2024-06-01T12:00:00.000Z", expected: "Jun 1, 2024" },
      { input: "2024-03-10T18:30:00.000Z", expected: "Mar 10, 2024" },
    ];

    testCases.forEach(({ input, expected }) => {
      expect(formatDate(input)).toBe(expected);
    });
  });

  it("should handle invalid date strings gracefully", () => {
    const invalidDates = [
      "invalid-date",
      "",
      "2024-13-45",
      null as any,
      undefined as any,
    ];

    invalidDates.forEach((invalidDate) => {
      expect(() => formatDate(invalidDate)).not.toThrow();

      expect(typeof formatDate(invalidDate)).toBe("string");
    });
  });

  it("should handle edge cases", () => {
    expect(formatDate("2024-02-29T00:00:00.000Z")).toBe("Feb 29, 2024");

    expect(formatDate("2023-12-31T12:00:00.000Z")).toBe("Dec 31, 2023");
    expect(formatDate("2024-01-01T12:00:00.000Z")).toBe("Jan 1, 2024");
  });
});

import React from "react";
import { render, screen, waitFor } from "@/__tests__/utils/test-utils";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/dashboard/layout";
import api from "@/utils/axios";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => "/dashboard"),
}));

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

describe("Protected Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe("Dashboard access control", () => {
    it("should redirect unauthenticated users to login page", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      mockApi.get.mockRejectedValueOnce(new Error("Unauthorized"));

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });

    it("should allow authenticated users to access dashboard", async () => {
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

      render(
        <DashboardLayout>
          <div data-testid="dashboard-content">Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-content")).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalledWith("/login");
    });

    it("should handle loading state during authentication check", async () => {
      const mockApi = api as jest.Mocked<typeof api>;
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApi.get.mockReturnValueOnce(promise as any);

      render(
        <DashboardLayout>
          <div data-testid="dashboard-content">Dashboard Content</div>
        </DashboardLayout>
      );

      expect(mockPush).not.toHaveBeenCalled();

      resolvePromise!({
        data: {
          id: "1",
          email: "test@example.com",
          firstName: "Test",
          role: "user",
          tokensUsed: 0,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-content")).toBeInTheDocument();
      });
    });
  });
});

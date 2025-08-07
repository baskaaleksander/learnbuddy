import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "../../../utils/test-utils";
import userEvent from "@testing-library/user-event";
import CurrentPlanInfo from "@/components/features/billing/current-plan-info";
import { CurrentPlanData } from "@/lib/definitions";
import api from "@/utils/axios";
import { toast } from "sonner";

jest.mock("@/utils/axios", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
  },
}));

jest.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children, open, onOpenChange }: any) =>
    open ? <div data-testid="drawer">{children}</div> : null,
  DrawerTrigger: ({ children }: any) => children,
  DrawerContent: ({ children }: any) => (
    <div data-testid="drawer-content">{children}</div>
  ),
  DrawerHeader: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  DrawerTitle: ({ children }: any) => <h2>{children}</h2>,
  DrawerDescription: ({ children }: any) => <p>{children}</p>,
  DrawerFooter: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  DrawerClose: ({ children, asChild, onClick, ...props }: any) => {
    if (asChild && children) {
      return React.cloneElement(children, { ...props, onClick });
    }
    return (
      <button {...props} onClick={onClick}>
        {children}
      </button>
    );
  },
}));

jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe("Current Plan Info", () => {
  const user = userEvent.setup();

  const mockPlanData: CurrentPlanData = {
    planName: "pro",
    planInterval: "MONTHLY",
    price: "19.99",
    currency: "usd",
    status: "active",
    createdAt: "2024-01-01T00:00:00.000Z",
    nextBillingDate: "2024-02-01T00:00:00.000Z",
    tokensUsed: 500,
    tokensLimit: 1000,
  };

  const mockUnlimitedPlanData: CurrentPlanData = {
    ...mockPlanData,
    planName: "unlimited",
    tokensLimit: 999999,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render empty state if no data is provided", () => {
    render(<CurrentPlanInfo />);

    expect(screen.getByText("Get Started with a Plan")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No current plan information available. Choose a plan to unlock all features!"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Subscribe Now")).toBeInTheDocument();

    const subscribeLink = screen.getByRole("link");
    expect(subscribeLink).toHaveAttribute(
      "href",
      "/dashboard/billing/purchase"
    );
  });

  it("should render current plan information if data is present", () => {
    render(<CurrentPlanInfo data={mockPlanData} />);

    expect(screen.getByText("Current Plan")).toBeInTheDocument();
    expect(screen.getByText("Subscription details")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();

    expect(screen.getByText("MONTHLY")).toBeInTheDocument();

    expect(screen.getByText("19.99 USD")).toBeInTheDocument();
  });

  it("should display correct plan name, status, and usage", () => {
    render(<CurrentPlanInfo data={mockPlanData} />);

    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("MONTHLY")).toBeInTheDocument();
    render(<CurrentPlanInfo data={mockPlanData} />);

    const proPlanName = screen.getAllByText("Pro");
    expect(proPlanName.length).toBeGreaterThan(0);

    const statusBadge = screen.getAllByText("Active");
    expect(statusBadge.length).toBeGreaterThan(0);
  });

  it("should calculate and display usage badge with correct variant", () => {
    const highUsagePlan = { ...mockPlanData, tokensUsed: 950 };
    const { rerender } = render(<CurrentPlanInfo data={highUsagePlan} />);

    expect(screen.getByText("95% used")).toBeInTheDocument();

    const mediumUsagePlan = { ...mockPlanData, tokensUsed: 750 };
    rerender(<CurrentPlanInfo data={mediumUsagePlan} />);
    expect(screen.getByText("75% used")).toBeInTheDocument();

    const lowUsagePlan = { ...mockPlanData, tokensUsed: 200 };
    rerender(<CurrentPlanInfo data={lowUsagePlan} />);
    expect(screen.getByText("20% used")).toBeInTheDocument();
  });

  it("should show unlimited indicator for unlimited plans", () => {
    render(<CurrentPlanInfo data={mockUnlimitedPlanData} />);

    const unlimitedBadges = screen.getAllByText("Unlimited");
    expect(unlimitedBadges.length).toBeGreaterThan(0);

    expect(screen.getByText("Used: 500")).toBeInTheDocument();
    expect(screen.getByText("Limit: Unlimited")).toBeInTheDocument();

    const progressBar = screen.queryByRole("progressbar");
    expect(progressBar).not.toBeInTheDocument();
  });

  it("should open cancel subscription dialog when user initiates cancellation", async () => {
    render(<CurrentPlanInfo data={mockPlanData} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(screen.getByText("Cancel subscription")).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to cancel/i)
    ).toBeInTheDocument();
  });

  it("should call API and handle cancel subscription flow", async () => {
    const mockApi = api as jest.Mocked<typeof api>;
    mockApi.post.mockResolvedValueOnce({ data: { success: true } });

    render(<CurrentPlanInfo data={mockPlanData} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText("Cancel subscription")).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByRole("button", { name: /^cancel$/i });
    expect(cancelButtons).toHaveLength(2);

    // The dialog cancel button should be the second one
    const confirmCancelButton = cancelButtons[1];
    await fireEvent.click(confirmCancelButton);

    expect(mockApi.post).toHaveBeenCalledWith("/billing/cancel-subscription");
  });

  it("should show toast message on successful cancellation", async () => {
    const mockApi = api as jest.Mocked<typeof api>;
    mockApi.post.mockResolvedValueOnce({ data: { success: true } });

    render(<CurrentPlanInfo data={mockPlanData} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText("Cancel subscription")).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByRole("button", { name: /^cancel$/i });
    const confirmCancelButton = cancelButtons[1]; // Second one is in the dialog
    await fireEvent.click(confirmCancelButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Subscription cancelled successfully."
      );
    });
  });

  it("should route user to purchase page when no plan is active", () => {
    const inactivePlan = { ...mockPlanData, status: "cancelled" };
    render(<CurrentPlanInfo data={inactivePlan} />);

    const reactivateButton = screen.getByText("Reactivate");
    const link = reactivateButton.closest("a");
    expect(link).toHaveAttribute("href", "/dashboard/billing/purchase");

    const changePlanButton = screen.getByText("Change Plan");
    const changePlanLink = changePlanButton.closest("a");
    expect(changePlanLink).toHaveAttribute(
      "href",
      "/dashboard/billing/purchase"
    );
  });
});

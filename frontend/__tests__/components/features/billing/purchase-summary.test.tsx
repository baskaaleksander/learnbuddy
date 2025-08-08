import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import userEvent from "@testing-library/user-event";
import PurchaseSummary from "@/components/features/billing/purchase-summary";
import { CurrentPlanData } from "@/lib/definitions";
import api from "@/utils/axios";
import { toast } from "sonner";

const mockApiPost = jest.fn();
const mockApiPatch = jest.fn();

jest.mock("@/utils/axios", () => ({
  __esModule: true,
  default: {
    post: mockApiPost,
    patch: mockApiPatch,
  },
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

delete (window as any).location;
window.location = { href: "" } as any;

describe("Purchase Summary", () => {
  const user = userEvent.setup();

  const mockCurrentPlanData: CurrentPlanData = {
    planName: "Tier 1",
    planInterval: "MONTHLY",
    price: "4.99",
    currency: "USD",
    status: "active",
    createdAt: "2024-01-01T00:00:00.000Z",
    nextBillingDate: "2024-02-01T00:00:00.000Z",
    tokensUsed: 50,
    tokensLimit: 100,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.location.href = "";
  });

  it("should render purchase summary with selected plan", () => {
    render(
      <PurchaseSummary
        currentPlanData={mockCurrentPlanData}
        priceChange={null}
        selectedPlan="Tier 2"
        isYearly={false}
      />
    );

    expect(screen.getByText("Purchase Summary")).toBeInTheDocument();
    expect(screen.getByText("Current Plan:")).toBeInTheDocument();
    expect(screen.getByText("Tier 1 (MONTHLY)")).toBeInTheDocument();
    expect(screen.getByText("Selected Plan:")).toBeInTheDocument();
    expect(screen.getByText("Tier 2")).toBeInTheDocument();
    expect(screen.getByText("$9.99")).toBeInTheDocument();
    expect(screen.getByText("300 tokens")).toBeInTheDocument();
  });

  it("should highlight upgrade, downgrade, or interval switch scenarios", () => {
    const { rerender } = render(
      <PurchaseSummary
        currentPlanData={mockCurrentPlanData}
        priceChange={null}
        selectedPlan="Tier 2"
        isYearly={false}
      />
    );

    expect(
      screen.getByRole("button", { name: /upgrade plan/i })
    ).toBeInTheDocument();

    rerender(
      <PurchaseSummary
        currentPlanData={mockCurrentPlanData}
        priceChange={null}
        selectedPlan="Free"
        isYearly={false}
      />
    );

    expect(
      screen.getByRole("button", { name: /downgrade to free/i })
    ).toBeInTheDocument();

    rerender(
      <PurchaseSummary
        currentPlanData={mockCurrentPlanData}
        priceChange={null}
        selectedPlan="Tier 1"
        isYearly={true}
      />
    );

    expect(
      screen.getByRole("button", { name: /switch billing/i })
    ).toBeInTheDocument();
  });

  it("should disable checkout for invalid or no-op plan changes", () => {
    const { rerender } = render(
      <PurchaseSummary
        currentPlanData={mockCurrentPlanData}
        priceChange={null}
        selectedPlan="Tier 1"
        isYearly={false}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /current plan/i })
    ).toBeInTheDocument();

    rerender(
      <PurchaseSummary
        currentPlanData={null}
        priceChange={null}
        selectedPlan="Free"
        isYearly={false}
      />
    );

    expect(screen.getByRole("button")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /current plan/i })
    ).toBeInTheDocument();
  });

  it("should call API on checkout for subscription update", async () => {
    mockApiPatch.mockResolvedValueOnce({ data: {} });

    render(
      <PurchaseSummary
        currentPlanData={mockCurrentPlanData}
        priceChange={null}
        selectedPlan="Tier 2"
        isYearly={false}
      />
    );

    const upgradeButton = screen.getByRole("button", { name: /upgrade plan/i });
    await user.click(upgradeButton);

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith(
        "/billing/update-subscription",
        {
          planName: "Tier 2",
          planInterval: "monthly",
        }
      );
    });

    expect(toast.success as jest.MockedFunction<any>).toHaveBeenCalledWith(
      "Subscription updated successfully!"
    );
    expect(window.location.href).toBe("/dashboard/billing");
  });

  it("should call API and redirect for new subscription", async () => {
    const mockCheckoutUrl = "https://checkout.stripe.com/session123";
    mockApiPost.mockResolvedValueOnce({ data: mockCheckoutUrl });

    const inactivePlanData = { ...mockCurrentPlanData, status: "canceled" };

    render(
      <PurchaseSummary
        currentPlanData={inactivePlanData}
        priceChange={null}
        selectedPlan="Tier 2"
        isYearly={false}
      />
    );

    const subscribeButton = screen.getByRole("button", {
      name: /subscribe now/i,
    });
    await fireEvent.click(subscribeButton);

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        "/billing/create-checkout-session",
        {
          planName: "Tier 2",
          planInterval: "monthly",
        }
      );
    });

    expect(window.location.href).toBe(mockCheckoutUrl);
  });

  it("should display loader and disable button while processing", async () => {
    mockApiPatch.mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 100))
    );

    render(
      <PurchaseSummary
        currentPlanData={mockCurrentPlanData}
        priceChange={null}
        selectedPlan="Tier 2"
        isYearly={false}
      />
    );

    const upgradeButton = screen.getByRole("button", { name: /upgrade plan/i });
    await user.click(upgradeButton);

    expect(screen.getByText("Processing...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();

    await waitFor(() => {
      expect(toast.success as jest.MockedFunction<any>).toHaveBeenCalled();
    });
  });

  it("should show price change indicator if applicable", () => {
    render(
      <PurchaseSummary
        currentPlanData={mockCurrentPlanData}
        priceChange={5.5}
        selectedPlan="Tier 2"
        isYearly={false}
      />
    );

    expect(screen.getByText("+$5.50 prorated today")).toBeInTheDocument();
  });

  it("should handle API errors gracefully and show error toast", async () => {
    const errorMessage = "Payment method required";
    mockApiPatch.mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    });

    render(
      <PurchaseSummary
        currentPlanData={mockCurrentPlanData}
        priceChange={null}
        selectedPlan="Tier 2"
        isYearly={false}
      />
    );

    const upgradeButton = screen.getByRole("button", { name: /upgrade plan/i });
    await user.click(upgradeButton);

    await waitFor(() => {
      expect(toast.error as jest.MockedFunction<any>).toHaveBeenCalledWith(
        "Failed to process request. Please try again."
      );
    });

    mockApiPatch.mockRejectedValueOnce(new Error("Network error"));
    await user.click(upgradeButton);

    await waitFor(() => {
      expect(toast.error as jest.MockedFunction<any>).toHaveBeenCalledWith(
        "Failed to process request. Please try again."
      );
    });
  });

  it("should format price display correctly", () => {
    const { rerender } = render(
      <PurchaseSummary
        currentPlanData={null}
        priceChange={null}
        selectedPlan="Free"
        isYearly={false}
      />
    );

    expect(screen.getByText("$0")).toBeInTheDocument();

    rerender(
      <PurchaseSummary
        currentPlanData={null}
        priceChange={null}
        selectedPlan="Tier 1"
        isYearly={false}
      />
    );

    expect(screen.getByText("$4.99")).toBeInTheDocument();
    expect(screen.getByText("/month")).toBeInTheDocument();

    rerender(
      <PurchaseSummary
        currentPlanData={null}
        priceChange={null}
        selectedPlan="Tier 1"
        isYearly={true}
      />
    );

    expect(screen.getByText("$49")).toBeInTheDocument();
    expect(screen.getByText("/year")).toBeInTheDocument();
    expect(
      screen.getByText("Save 20% with yearly billing")
    ).toBeInTheDocument();
  });

  it("should handle selecting free plan with no current plan", () => {
    render(
      <PurchaseSummary
        currentPlanData={null}
        priceChange={null}
        selectedPlan="Free"
        isYearly={false}
      />
    );

    expect(screen.getByText("Free Plan")).toBeInTheDocument();
    expect(
      screen.getByText("You're currently on the Free plan with basic features.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /current plan/i })
    ).toBeInTheDocument();
  });

  it("should show welcome message for new subscription", () => {
    render(
      <PurchaseSummary
        currentPlanData={null}
        priceChange={null}
        selectedPlan="Tier 1"
        isYearly={false}
      />
    );

    expect(screen.getByText("Welcome!")).toBeInTheDocument();
    expect(
      screen.getByText("Start your learning journey with our Tier 1 plan.")
    ).toBeInTheDocument();
  });

  it("should show downgrade information for downgrades", () => {
    render(
      <PurchaseSummary
        currentPlanData={mockCurrentPlanData}
        priceChange={null}
        selectedPlan="Free"
        isYearly={false}
      />
    );

    expect(
      screen.getByRole("button", { name: /downgrade to free/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your subscription will be cancelled and you'll receive a full refund for the unused portion of your billing period."
      )
    ).toBeInTheDocument();
  });

  it("should show current plan badge when same plan is selected", () => {
    render(
      <PurchaseSummary
        currentPlanData={mockCurrentPlanData}
        priceChange={null}
        selectedPlan="Tier 1"
        isYearly={false}
      />
    );

    expect(
      screen.getByRole("button", { name: /current plan/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText("You already have this plan active.")
    ).toBeInTheDocument();
  });

  it("should not show price change indicator when conditions are not met", () => {
    const { rerender } = render(
      <PurchaseSummary
        currentPlanData={null}
        priceChange={5.5}
        selectedPlan="Tier 1"
        isYearly={false}
      />
    );

    expect(screen.queryByText("+$5.50 prorated today")).not.toBeInTheDocument();

    rerender(
      <PurchaseSummary
        currentPlanData={mockCurrentPlanData}
        priceChange={0}
        selectedPlan="Tier 2"
        isYearly={false}
      />
    );

    expect(screen.queryByText("prorated today")).not.toBeInTheDocument();
  });

  it("should handle yearly billing switch correctly", () => {
    render(
      <PurchaseSummary
        currentPlanData={mockCurrentPlanData}
        priceChange={null}
        selectedPlan="Tier 1"
        isYearly={true}
      />
    );

    expect(
      screen.getByRole("button", { name: /switch billing/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Yearly")).toBeInTheDocument();
  });
});

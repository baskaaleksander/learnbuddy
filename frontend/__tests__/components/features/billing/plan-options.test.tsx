import { render, screen } from "../../../utils/test-utils";
import userEvent from "@testing-library/user-event";
import PlanOptions from "@/components/features/billing/plan-options";

jest.mock("@/lib/pricing-plans", () => ({
  pricingPlans: {
    monthly: [
      {
        nameOfPlan: "Basic",
        price: 9.99,
        features: ["Feature 1", "Feature 2"],
      },
      {
        nameOfPlan: "Pro",
        price: 19.99,
        features: ["Feature 1", "Feature 2", "Feature 3"],
      },
    ],
    yearly: [
      {
        nameOfPlan: "Basic",
        price: 99.99,
        features: ["Feature 1", "Feature 2"],
      },
      {
        nameOfPlan: "Pro",
        price: 199.99,
        features: ["Feature 1", "Feature 2", "Feature 3"],
      },
    ],
  },
}));

describe("PlanOptions", () => {
  const user = userEvent.setup();
  const mockSetSelectedPlan = jest.fn();
  const mockSetIsYearly = jest.fn();

  const defaultProps = {
    selectedPlan: null,
    setSelectedPlan: mockSetSelectedPlan,
    isYearly: false,
    setIsYearly: mockSetIsYearly,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should toggle between monthly and yearly pricing", async () => {
    render(<PlanOptions {...defaultProps} />);

    const monthlyButton = screen.getByRole("button", { name: /monthly/i });
    const yearlyButton = screen.getByRole("button", { name: /yearly/i });

    expect(monthlyButton).toHaveClass("shadow-sm");
    expect(yearlyButton).not.toHaveClass("shadow-sm");

    await user.click(yearlyButton);
    expect(mockSetIsYearly).toHaveBeenCalledWith(true);
  });

  it("should display correct pricing based on selected period", () => {
    const { rerender } = render(<PlanOptions {...defaultProps} />);

    expect(screen.getByText("9.99")).toBeInTheDocument();
    expect(screen.getByText("19.99")).toBeInTheDocument();

    rerender(<PlanOptions {...defaultProps} isYearly={true} />);

    expect(screen.getByText("99.99")).toBeInTheDocument();
    expect(screen.getByText("199.99")).toBeInTheDocument();
  });

  it("should highlight selected plan", () => {
    render(<PlanOptions {...defaultProps} selectedPlan="Basic" />);

    const basicPlan = screen.getByText("Basic");
    expect(basicPlan).toBeInTheDocument();
  });

  it("should call setSelectedPlan when plan is clicked", async () => {
    render(<PlanOptions {...defaultProps} />);

    const basicPlan = screen.getByText("Basic");
    await user.click(basicPlan);

    expect(mockSetSelectedPlan).toHaveBeenCalledWith("Basic");
  });

  it("should apply visual feedback for selected plan", () => {
    render(<PlanOptions {...defaultProps} selectedPlan="Pro" />);

    const proPlan = screen.getByText("Pro");
    expect(proPlan).toBeInTheDocument();
  });

  it("should render all pricing cards in grid layout", () => {
    render(<PlanOptions {...defaultProps} />);

    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("should handle plan selection state correctly", async () => {
    render(<PlanOptions {...defaultProps} />);

    expect(mockSetSelectedPlan).not.toHaveBeenCalled();

    const basicPlan = screen.getByText("Basic");
    await user.click(basicPlan);

    expect(mockSetSelectedPlan).toHaveBeenCalledWith("Basic");
  });

  it("should apply responsive design for different screen sizes", () => {
    const { container } = render(<PlanOptions {...defaultProps} />);

    const gridContainer = container.querySelector(".grid");
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass(
      "grid-cols-1",
      "md:grid-cols-2",
      "lg:grid-cols-4"
    );
  });

  it("should show yearly vs monthly toggle with proper styling", () => {
    render(<PlanOptions {...defaultProps} />);

    const monthlyButton = screen.getByRole("button", { name: /monthly/i });
    const yearlyButton = screen.getByRole("button", { name: /yearly/i });

    expect(monthlyButton).toBeInTheDocument();
    expect(yearlyButton).toBeInTheDocument();

    expect(monthlyButton).toHaveClass("shadow-sm");
    expect(yearlyButton).not.toHaveClass("shadow-sm");
  });

  it("should handle yearly pricing selection", async () => {
    render(<PlanOptions {...defaultProps} />);

    const yearlyButton = screen.getByRole("button", { name: /yearly/i });
    await user.click(yearlyButton);

    expect(mockSetIsYearly).toHaveBeenCalledWith(true);
  });

  it("should handle monthly pricing selection", async () => {
    render(<PlanOptions {...defaultProps} isYearly={true} />);

    const monthlyButton = screen.getByRole("button", { name: /monthly/i });
    await user.click(monthlyButton);

    expect(mockSetIsYearly).toHaveBeenCalledWith(false);
  });

  it("should handle no selected plan state", () => {
    render(<PlanOptions {...defaultProps} selectedPlan={null} />);

    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("should be accessible with proper ARIA attributes", () => {
    render(<PlanOptions {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: /monthly/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /yearly/i })).toBeInTheDocument();

    const basicPlan = screen.getByText("Basic");
    expect(basicPlan).toBeInTheDocument();
  });

  it("should handle rapid plan selection changes", async () => {
    render(<PlanOptions {...defaultProps} />);

    const basicPlan = screen.getByText("Basic");
    const proPlan = screen.getByText("Pro");

    await user.click(basicPlan);
    await user.click(proPlan);
    await user.click(basicPlan);

    expect(mockSetSelectedPlan).toHaveBeenCalledWith("Basic");
    expect(mockSetSelectedPlan).toHaveBeenCalledWith("Pro");
  });
});

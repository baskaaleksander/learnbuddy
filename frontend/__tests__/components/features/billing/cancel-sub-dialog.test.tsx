import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import CancelSubDialog from "@/components/features/billing/cancel-sub-dialog";

jest.mock("@/app/hooks/use-media-query", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue(false),
}));

describe("Cancel Subscription Dialog", () => {
  const mockOnDeleteAction = jest.fn();
  const mockSetIsOpenAction = jest.fn();

  const defaultProps = {
    isOpen: true,
    setIsOpenAction: mockSetIsOpenAction,
    onDeleteAction: mockOnDeleteAction,
    submitting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render dialog version on desktop screens", () => {
    const useMediaQuery = require("@/app/hooks/use-media-query").default;
    useMediaQuery.mockReturnValue(true);

    render(<CancelSubDialog {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should render drawer version on mobile screens", () => {
    const useMediaQuery = require("@/app/hooks/use-media-query").default;
    useMediaQuery.mockReturnValue(false);

    render(<CancelSubDialog {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should display correct title and description in dialog/drawer", () => {
    render(<CancelSubDialog {...defaultProps} />);

    expect(screen.getAllByText(/cancel subscription/i)[0]).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to cancel/i)
    ).toBeInTheDocument();
  });

  it("should call onDeleteAction when Cancel button is clicked", async () => {
    render(<CancelSubDialog {...defaultProps} />);

    const cancelButton = screen.getByRole("button", { name: /^cancel$/i });
    await fireEvent.click(cancelButton);

    expect(mockOnDeleteAction).toHaveBeenCalledTimes(1);
  });

  it("should disable Cancel button and show loader when submitting is true", () => {
    render(<CancelSubDialog {...defaultProps} submitting={true} />);

    const cancelButton = screen.getByRole("button", { name: /^cancel$/i });
    expect(cancelButton).toBeDisabled();
    expect(cancelButton.querySelector("svg")).toBeInTheDocument();
  });

  it("should call setIsOpenAction(false) when Dismiss button is clicked", async () => {
    render(<CancelSubDialog {...defaultProps} />);

    const dismissButton = screen.getByRole("button", { name: /dismiss/i });
    await fireEvent.click(dismissButton);

    expect(mockSetIsOpenAction).toHaveBeenCalledWith(false);
  });

  it("should not throw if opened/closed rapidly", async () => {
    const { rerender } = render(
      <CancelSubDialog {...defaultProps} isOpen={false} />
    );

    rerender(<CancelSubDialog {...defaultProps} isOpen={true} />);
    rerender(<CancelSubDialog {...defaultProps} isOpen={false} />);
    rerender(<CancelSubDialog {...defaultProps} isOpen={true} />);

    expect(() => {
      rerender(<CancelSubDialog {...defaultProps} isOpen={false} />);
    }).not.toThrow();
  });
});

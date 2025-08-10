import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import DeleteAssetDialog from "@/components/common/delete-asset-dialog";

jest.mock("@/app/hooks/use-media-query", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue(false),
}));

describe("Delete Asset Dialog", () => {
  const mockOnDeleteAction = jest.fn();
  const mockSetIsOpenAction = jest.fn();

  const defaultProps = {
    isOpen: true,
    setIsOpenAction: mockSetIsOpenAction,
    onDeleteAction: mockOnDeleteAction,
    submitting: false,
    name: "Material",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with required props (desktop dialog)", () => {
    const useMediaQuery = require("@/app/hooks/use-media-query").default;
    useMediaQuery.mockReturnValue(true);

    render(<DeleteAssetDialog {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/delete material/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /are you sure you want to delete this material\? this action cannot be undone\./i
      )
    ).toBeInTheDocument();
  });

  it("renders with required props (mobile drawer)", () => {
    const useMediaQuery = require("@/app/hooks/use-media-query").default;
    useMediaQuery.mockReturnValue(false);

    render(<DeleteAssetDialog {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/delete material/i)).toBeInTheDocument();
  });

  it("displays asset name in title and description", () => {
    render(<DeleteAssetDialog {...defaultProps} name="FlashCards" />);

    expect(screen.getByText(/delete flashcards/i)).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to delete this flashcards\?/i)
    ).toBeInTheDocument();
  });

  it("calls onDeleteAction when Delete is clicked", async () => {
    render(<DeleteAssetDialog {...defaultProps} />);

    const deleteBtn = screen.getByRole("button", { name: /^delete$/i });
    await fireEvent.click(deleteBtn);

    expect(mockOnDeleteAction).toHaveBeenCalledTimes(1);
  });

  it("disables Delete and shows loader when submitting", () => {
    render(<DeleteAssetDialog {...defaultProps} submitting={true} />);

    const deleteBtn = screen.getByRole("button", { name: /^delete$/i });
    expect(deleteBtn).toBeDisabled();
    expect(deleteBtn.querySelector("svg")).toBeInTheDocument();
  });

  it("closes on Cancel (desktop)", async () => {
    const useMediaQuery = require("@/app/hooks/use-media-query").default;
    useMediaQuery.mockReturnValue(true);

    render(<DeleteAssetDialog {...defaultProps} />);

    const cancelBtn = screen.getByRole("button", { name: /^cancel$/i });
    await fireEvent.click(cancelBtn);

    expect(mockSetIsOpenAction).toHaveBeenCalledWith(false);
  });

  it("closes on Cancel (mobile)", async () => {
    const useMediaQuery = require("@/app/hooks/use-media-query").default;
    useMediaQuery.mockReturnValue(false);

    render(<DeleteAssetDialog {...defaultProps} />);

    const cancelBtn = screen.getByRole("button", { name: /^cancel$/i });
    await fireEvent.click(cancelBtn);

    expect(mockSetIsOpenAction).toHaveBeenCalledWith(false);
  });

  it("displays fallback when name is missing", () => {
    render(<DeleteAssetDialog {...defaultProps} name="" />);

    expect(
      screen.getByRole("heading", { name: /^delete$/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/delete undefined/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/delete null/i)).not.toBeInTheDocument();
  });
});

import {
  render,
  screen,
  fireEvent,
  within,
} from "@/__tests__/utils/test-utils";
import { GenerateAssetDialog } from "@/components/common/generate-asset";

jest.mock("@/app/hooks/use-media-query", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue(false),
}));

describe("Generate Asset Dialog", () => {
  const mockOnGenerateAction = jest.fn();
  const mockSetIsOpenAction = jest.fn();

  const defaultProps = {
    isOpen: true,
    setIsOpenAction: mockSetIsOpenAction,
    onGenerateAction: mockOnGenerateAction,
    submitting: false,
    triggerText: "Generate",
    assetData: {
      title: "Quiz",
      description: "Generate a quiz from your material",
      cost: 5,
    },
    availableTokens: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with required props (desktop dialog)", () => {
    const useMediaQuery = require("@/app/hooks/use-media-query").default;
    useMediaQuery.mockReturnValue(true);

    render(<GenerateAssetDialog {...defaultProps} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/^generate quiz$/i)).toBeInTheDocument();
    expect(
      screen.getByText(/generate a quiz from your material/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/it will cost you 5/i)).toBeInTheDocument();
  });

  it("renders with required props (mobile drawer)", () => {
    const useMediaQuery = require("@/app/hooks/use-media-query").default;
    useMediaQuery.mockReturnValue(false);

    render(<GenerateAssetDialog {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /generate quiz/i })
    ).toBeInTheDocument();
  });

  it("calls onGenerateAction when Generate is clicked (desktop)", async () => {
    const useMediaQuery = require("@/app/hooks/use-media-query").default;
    useMediaQuery.mockReturnValue(true);

    render(<GenerateAssetDialog {...defaultProps} />);

    const dialog = screen.getByRole("dialog");
    const generateBtn = within(dialog).getByRole("button", {
      name: /^generate quiz$/i,
    });
    await fireEvent.click(generateBtn);

    expect(mockOnGenerateAction).toHaveBeenCalledTimes(1);
  });

  it("disables generate and shows warning when tokens are insufficient (desktop)", () => {
    const useMediaQuery = require("@/app/hooks/use-media-query").default;
    useMediaQuery.mockReturnValue(true);

    render(
      <GenerateAssetDialog
        {...defaultProps}
        availableTokens={2}
        assetData={{ ...defaultProps.assetData, cost: 5 }}
      />
    );

    const dialog = screen.getByRole("dialog");
    const generateBtn = within(dialog).getByRole("button", {
      name: /^generate quiz$/i,
    });
    expect(generateBtn).toBeDisabled();
    expect(
      screen.getByText(/you do not have enough tokens/i)
    ).toBeInTheDocument();
  });

  it("disables generate and shows warning when tokens are insufficient (mobile)", () => {
    const useMediaQuery = require("@/app/hooks/use-media-query").default;
    useMediaQuery.mockReturnValue(false);

    render(
      <GenerateAssetDialog
        {...defaultProps}
        availableTokens={1}
        assetData={{ ...defaultProps.assetData, cost: 3 }}
      />
    );

    const dialog = screen.getByRole("dialog");
    const generateBtn = within(dialog).getByRole("button", {
      name: /generate quiz/i,
    });
    expect(generateBtn).toBeDisabled();
    expect(
      screen.getByText(/you do not have enough tokens/i)
    ).toBeInTheDocument();
  });

  it("closes on Cancel (desktop)", async () => {
    const useMediaQuery = require("@/app/hooks/use-media-query").default;
    useMediaQuery.mockReturnValue(true);

    render(<GenerateAssetDialog {...defaultProps} />);

    const cancelBtn = screen.getByTestId("cancel-button");
    await fireEvent.click(cancelBtn);

    expect(mockSetIsOpenAction).toHaveBeenCalledWith(false);
  });

  it("closes on Cancel (mobile)", async () => {
    const useMediaQuery = require("@/app/hooks/use-media-query").default;
    useMediaQuery.mockReturnValue(false);

    render(<GenerateAssetDialog {...defaultProps} />);

    const cancelBtn = screen.getByTestId("cancel-button");
    await fireEvent.click(cancelBtn);

    expect(mockSetIsOpenAction).toHaveBeenCalledWith(false);
  });

  it("displays fallback when title or description is missing", () => {
    const useMediaQuery = require("@/app/hooks/use-media-query").default;
    useMediaQuery.mockReturnValue(true);

    render(
      <GenerateAssetDialog
        {...defaultProps}
        assetData={{ title: "", description: "", cost: 0 }}
      />
    );

    expect(
      screen.getByRole("heading", { name: /^generate$/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/null/i)).not.toBeInTheDocument();
  });
});

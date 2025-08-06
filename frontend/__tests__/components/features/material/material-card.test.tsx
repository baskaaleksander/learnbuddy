import { render, screen, fireEvent } from "../../../utils/test-utils";
import userEvent from "@testing-library/user-event";
import MaterialCard from "@/components/features/material/material-card";
import { createMockMaterial } from "../../../utils/test-utils";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("MaterialCard", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render material title and description", () => {
    const material = createMockMaterial({
      title: "Test Material Title",
      description: "Test Material Description",
    });

    render(<MaterialCard {...material} />);

    expect(screen.getByText("Test Material Title")).toBeInTheDocument();
    expect(screen.getByText("Test Material Description")).toBeInTheDocument();
  });

  it("should display creation date in formatted format", () => {
    const material = createMockMaterial({
      createdAt: "2024-01-15T10:30:00.000Z",
    });

    render(<MaterialCard {...material} />);

    expect(screen.getByText(/jan 15, 2024/i)).toBeInTheDocument();
  });

  it("should show different styling for PENDING status", () => {
    const material = createMockMaterial({
      status: "PENDING",
    });

    const { container } = render(<MaterialCard {...material} />);

    expect(container.firstChild).toHaveClass("border-red-500");
    expect(container.firstChild).toHaveClass("bg-red-50");
  });

  it("should show different styling for FAILED status", () => {
    const material = createMockMaterial({
      status: "FAILED",
    });

    const { container } = render(<MaterialCard {...material} />);

    expect(container.firstChild).toHaveClass("border-red-500");
    expect(container.firstChild).toHaveClass("bg-red-50");
  });

  it("should show different styling for PROCESSED status", () => {
    const material = createMockMaterial({
      status: "PROCESSED",
    });

    const { container } = render(<MaterialCard {...material} />);

    expect(container.firstChild).not.toHaveClass("border-red-500");
    expect(container.firstChild).not.toHaveClass("bg-red-50");
  });

  it("should navigate to upload page for PENDING materials", async () => {
    const material = createMockMaterial({
      status: "PENDING",
    });

    render(<MaterialCard {...material} />);

    const card = screen.getByRole("link");
    await user.click(card);

    expect(mockPush).toHaveBeenCalledWith("/dashboard/materials/upload/1");
  });

  it("should navigate to material detail page for PROCESSED materials", async () => {
    const material = createMockMaterial({
      status: "PROCESSED",
    });

    render(<MaterialCard {...material} />);

    const card = screen.getByRole("link");
    await user.click(card);

    expect(mockPush).toHaveBeenCalledWith("/dashboard/materials/1");
  });

  it("should open dropdown menu when more button is clicked", async () => {
    const material = createMockMaterial();

    render(<MaterialCard {...material} />);

    const moreButton = screen.getByRole("button", { name: /open menu/i });
    await user.click(moreButton);

    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("should navigate to edit page when edit is clicked", async () => {
    const material = createMockMaterial();

    render(<MaterialCard {...material} />);

    const moreButton = screen.getByRole("button", { name: /open menu/i });
    await user.click(moreButton);

    const editButton = screen.getByText("Edit");
    await user.click(editButton);

    expect(mockPush).toHaveBeenCalledWith("/dashboard/materials/1/edit");
  });

  it("should open delete dialog when delete is clicked", async () => {
    const material = createMockMaterial();

    render(<MaterialCard {...material} />);

    const moreButton = screen.getByRole("button", { name: /open menu/i });
    await user.click(moreButton);

    const deleteButton = screen.getByText("Delete");
    await user.click(deleteButton);

    expect(screen.getByText(/delete test material/i)).toBeInTheDocument();
  });

  it("should show processing status message for non-processed materials", () => {
    const pendingMaterial = createMockMaterial({
      status: "PENDING",
    });

    const { rerender } = render(<MaterialCard {...pendingMaterial} />);
    expect(screen.getByText("Processing...")).toBeInTheDocument();

    const failedMaterial = createMockMaterial({
      status: "FAILED",
    });

    rerender(<MaterialCard {...failedMaterial} />);
    expect(screen.getByText("Processing failed")).toBeInTheDocument();
  });

  it("should apply hover effects and transitions", () => {
    const material = createMockMaterial();

    const { container } = render(<MaterialCard {...material} />);

    expect(container.firstChild).toHaveClass("hover:shadow-md");
    expect(container.firstChild).toHaveClass("transition-all");
  });

  it("should handle click events and prevent default when needed", async () => {
    const material = createMockMaterial();

    render(<MaterialCard {...material} />);

    const moreButton = screen.getByRole("button", { name: /open menu/i });
    await user.click(moreButton);

    const deleteButton = screen.getByText("Delete");

    fireEvent.click(deleteButton, { bubbles: true });

    expect(screen.getByText(/delete test material/i)).toBeInTheDocument();
  });

  it("should render with custom className", () => {
    const material = createMockMaterial();

    const { container } = render(
      <MaterialCard {...material} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should show file icon", () => {
    const material = createMockMaterial();

    render(<MaterialCard {...material} />);

    expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
  });
});

import React from "react";
import { render, screen } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import MaterialCard from "@/components/features/material/material-card";

jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("Material Card", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseProps = {
    id: "mat-1",
    title: "Sample Material",
    description: "Some description",
    createdAt: "2024-01-01T00:00:00.000Z",
  };

  it("should render upload card without crashing", () => {
    render(<MaterialCard {...baseProps} status="PENDING" />);

    expect(screen.getByText(/sample material/i)).toBeInTheDocument();
    expect(screen.getByText(/created/i)).toBeInTheDocument();
  });

  it("should display upload icon and label", () => {
    render(<MaterialCard {...baseProps} status="PENDING" />);

    const fileIcons = document.querySelectorAll(".lucide-file");
    expect(fileIcons.length).toBeGreaterThan(0);
    expect(screen.getByText(/review/i)).toBeInTheDocument();
  });

  it("should navigate to upload page on click", async () => {
    const user = userEvent.setup();
    render(<MaterialCard {...baseProps} status="PENDING" />);

    const cta = screen.getByRole("button", { name: /review/i });
    await user.click(cta);

    expect(pushMock).toHaveBeenCalledWith(
      `/dashboard/materials/upload/${baseProps.id}`
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      `/dashboard/materials/upload/${baseProps.id}`
    );
  });

  it("should apply custom className if provided", () => {
    const className = "custom-shadow-ring";
    render(
      <MaterialCard {...baseProps} status="PENDING" className={className} />
    );

    const card = screen
      .getByText(/sample material/i)
      .closest("div[data-slot='card']");
    expect(card).toHaveClass(className);
  });
});

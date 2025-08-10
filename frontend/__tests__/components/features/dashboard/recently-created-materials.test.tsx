import React from "react";
import { render, screen } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import RecentlyCreatedMaterials from "@/components/features/dashboard/recently-created-materials";
import { MaterialData } from "@/lib/definitions";

describe("RecentlyCreatedMaterials", () => {
  it("renders with required props", () => {
    const materials: MaterialData[] = [
      {
        id: "1",
        title: "Algebra Basics",
        description: "Intro to algebra",
        status: "PROCESSED",
        content: "",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        title: "Biology Notes",
        description: "Cells and DNA",
        status: "PROCESSED",
        content: "",
        createdAt: "2024-02-01T00:00:00.000Z",
      },
    ];

    render(<RecentlyCreatedMaterials recentlyCreatedMaterials={materials} />);

    expect(
      screen.getByRole("heading", { name: /recently created materials/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /algebra basics/i })
    ).toHaveAttribute("href", "/dashboard/materials/1");
    expect(
      screen.getByRole("link", { name: /biology notes/i })
    ).toHaveAttribute("href", "/dashboard/materials/2");

    expect(screen.getByText(/intro to algebra/i)).toBeInTheDocument();
    expect(screen.getByText(/cells and dna/i)).toBeInTheDocument();

    const expectedDate1 = new Date(materials[0].createdAt).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "short", day: "numeric" }
    );
    const expectedDate2 = new Date(materials[1].createdAt).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "short", day: "numeric" }
    );

    expect(screen.getByText(expectedDate1)).toBeInTheDocument();
    expect(screen.getByText(expectedDate2)).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /view all materials/i })
    ).toHaveAttribute("href", "/dashboard/materials");
  });

  it("calls click handler when a material card is clicked", async () => {
    const user = userEvent.setup();
    const materials: MaterialData[] = [
      {
        id: "123",
        title: "Click Me",
        description: "d",
        status: "PROCESSED",
        content: "",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    ];

    render(<RecentlyCreatedMaterials recentlyCreatedMaterials={materials} />);

    const link = screen.getByRole("link", { name: /click me/i });
    const clickHandler = jest.fn();
    link.addEventListener("click", clickHandler);

    await user.click(link);
    expect(clickHandler).toHaveBeenCalled();
  });

  it("displays fallback when data is missing", () => {
    render(<RecentlyCreatedMaterials recentlyCreatedMaterials={[]} />);

    expect(screen.getByText(/no materials yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /upload your first material/i })
    ).toHaveAttribute("href", "/dashboard/materials/upload");

    expect(
      screen.queryByRole("link", { name: /view all materials/i })
    ).not.toBeInTheDocument();
  });
});

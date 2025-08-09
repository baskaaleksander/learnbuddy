import React from "react";
import { render, screen, waitFor } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { fireEvent, within } from "@testing-library/react";
import MaterialQuiz from "@/components/features/material/material-quiz";
import { fetchGraphQL } from "@/utils/gql-axios";
import { toast } from "sonner";

jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return {
    ...actual,
    useAuth: () => ({
      getUserTokens: jest
        .fn()
        .mockResolvedValue({ tokensLimit: 10, tokensUsed: 0 }),
    }),
  };
});

jest.mock("@/utils/gql-axios", () => ({
  fetchGraphQL: jest.fn(),
}));

const mockToast = toast as jest.Mocked<typeof toast>;

describe("Material Quiz", () => {
  const id = "mat-123";
  const quiz = {
    id: "quiz-1",
    createdAt: "2024-01-01T00:00:00.000Z",
    averageScore: 7.5,
    totalAttempts: 5,
    averagePercentage: 75,
    bestScore: 9.3,
    latestResult: { score: 8.4, completedAt: "2024-01-05T00:00:00.000Z" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render material card with title, description, and status", async () => {
    (fetchGraphQL as jest.Mock).mockResolvedValue({
      getQuizzesByMaterial: quiz,
    });

    render(<MaterialQuiz id={id} onAssetChange={jest.fn()} />);

    await screen.findByText(quiz.averageScore.toFixed(1));

    const titleLinks = screen.getAllByRole("link", { name: /quiz/i });
    expect(titleLinks[0]).toHaveAttribute(
      "href",
      `/dashboard/quizzes/${quiz.id}`
    );

    expect(screen.getByText(String(quiz.bestScore))).toBeInTheDocument();
    expect(screen.getByText(quiz.averageScore.toFixed(1))).toBeInTheDocument();
    expect(screen.getByText(String(quiz.totalAttempts))).toBeInTheDocument();
    expect(screen.getByText(/average percentage rate/i)).toBeInTheDocument();
    expect(screen.getByText(/latest attempt/i)).toBeInTheDocument();
    expect(
      screen.getByText(`${quiz.latestResult.score.toFixed(1)}/10`)
    ).toBeInTheDocument();

    const percent = `${quiz.averagePercentage.toFixed(0)}%`;
    expect(screen.getByText(percent)).toBeInTheDocument();
  });

  it("should visually indicate pending or failed status", async () => {
    let resolveFn: Function = () => {};
    (fetchGraphQL as jest.Mock)
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveFn = resolve))
      )
      .mockResolvedValueOnce({ getQuizzesByMaterial: quiz });

    const { unmount } = render(
      <MaterialQuiz id={id} onAssetChange={jest.fn()} />
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    resolveFn({ getQuizzesByMaterial: quiz });
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    unmount();

    (fetchGraphQL as jest.Mock).mockRejectedValue(new Error("boom"));
    render(<MaterialQuiz id={id} onAssetChange={jest.fn()} />);
    await waitFor(() => {
      expect(
        screen.getByText(/failed to fetch quizzes\. please try again later\./i)
      ).toBeInTheDocument();
    });
  });

  it("should show delete dialog when triggered", async () => {
    (fetchGraphQL as jest.Mock).mockResolvedValue({
      getQuizzesByMaterial: quiz,
    });

    render(<MaterialQuiz id={id} onAssetChange={jest.fn()} />);

    await screen.findByText(String(quiz.totalAttempts));

    const user = userEvent.setup();
    const delBtn = screen.getByRole("button", { name: /delete/i });
    await user.click(delBtn);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
  });

  it("should call onDelete after successful deletion", async () => {
    (fetchGraphQL as jest.Mock).mockImplementation((query: string) => {
      if (query.includes("deleteQuiz")) {
        return Promise.resolve({ deleteQuiz: true });
      }
      return Promise.resolve({ getQuizzesByMaterial: quiz });
    });

    const onAssetChange = jest.fn();
    render(<MaterialQuiz id={id} onAssetChange={onAssetChange} />);

    await screen.findByText(String(quiz.totalAttempts));

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /delete/i }));

    const dialog = await screen.findByRole("dialog");
    const confirmDelete = within(dialog).getByRole("button", {
      name: /^delete$/i,
    });
    await fireEvent.click(confirmDelete);

    await waitFor(() => {
      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining(`deleteQuiz(id: "${id}")`)
      );
    });

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        "Quiz deleted successfully.",
        expect.objectContaining({ icon: expect.any(Object) })
      );
      expect(onAssetChange).toHaveBeenCalledTimes(1);
    });
  });

  it("should navigate to correct page based on status when clicked", async () => {
    (fetchGraphQL as jest.Mock).mockResolvedValue({
      getQuizzesByMaterial: quiz,
    });

    render(<MaterialQuiz id={id} onAssetChange={jest.fn()} />);

    await screen.findByText(String(quiz.totalAttempts));

    const takeLink = screen.getByRole("link", { name: /take quiz/i });
    expect(takeLink).toHaveAttribute(
      "href",
      `/dashboard/quizzes/${quiz.id}/take`
    );

    const viewResults = screen.getByRole("link", {
      name: /view all results/i,
    });
    expect(viewResults).toHaveAttribute(
      "href",
      `/dashboard/quizzes/${quiz.id}/`
    );
  });

  it("should open and close dropdown menu", async () => {
    (fetchGraphQL as jest.Mock).mockResolvedValue({
      getQuizzesByMaterial: quiz,
    });

    render(<MaterialQuiz id={id} onAssetChange={jest.fn()} />);
    await screen.findByText(String(quiz.totalAttempts));

    const user = userEvent.setup();
    const regenBtn = screen.getByRole("button", { name: /regenerate/i });
    await user.click(regenBtn);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    const cancel = within(dialog).getByTestId("cancel-button");
    await fireEvent.click(cancel);

    await waitFor(() => {
      const dlg = screen.queryByRole("dialog", { name: /generate quiz/i });
      if (dlg) {
        expect(dlg).toHaveAttribute("data-state", "closed");
      } else {
        expect(dlg).toBeNull();
      }
    });
  });
});

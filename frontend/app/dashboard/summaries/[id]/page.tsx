"use client";
import DeleteAssetDialog from "@/components/common/delete-asset-dialog";
import ErrorComponent from "@/components/common/error-component";
import { GenerateAssetDialog } from "@/components/common/generate-asset";
import LoadingScreen from "@/components/common/loading-screen";
import SummaryChapter from "@/components/features/summaries/summary-chapter";
import TableOfContents from "@/components/features/summaries/table-of-contents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SummaryData } from "@/lib/definitions";
import api from "@/utils/axios";
import { fetchGraphQL } from "@/utils/gql-axios";
import { ExternalLink, RefreshCw, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { use, useEffect, useState } from "react";
import { toast } from "sonner";

function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [regenerateDialogOpen, setRegenerateDialogOpen] =
    useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [submittingRegenerate, setSubmittingRegenerate] =
    useState<boolean>(false);
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false);
  const [hideKnownChapters, setHideKnownChapters] = useState<boolean>(false);
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const summaryResponse = await fetchGraphQL(`
            query GetSummaryById {
                getSummaryById(id: "${id}") {
                    id
                    materialId
                    type
                    content
                    createdAt
                    errorMessage
                    title
                    chaptersCount
                    bulletPointsCount
                    material {
                        id
                        title
                    }
                }
            }
        `);

      if (summaryResponse.getSummaryById) {
        setSummary(summaryResponse.getSummaryById);
      } else {
        setError("Summary not found");
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      setError("Failed to fetch summary. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [id]);

  const handleMaterialClick = () => {
    if (summary?.material && summary.material.id) {
      router.push(`/dashboard/materials/${summary.material.id}`);
    } else {
      toast.error("Material not found or not linked to this summary.");
    }
  };

  const handleRegenerateSummary = async () => {
    try {
      setSubmittingRegenerate(true);
      setError(null);
      await fetchGraphQL(`
        mutation RegenerateSummary {
            regenerateSummary(materialId: "${summary?.material?.id}" )
        }
    `);
      toast("Summary regenerated successfully.", {
        icon: <RefreshCw className="h-4 w-4" />,
        duration: 3000,
      });
      router.push("/dashboard/summaries/");
    } catch (error) {
      setError("Failed to regenerate summary. Please try again later.");
      toast.error("Failed to regenerate summary. Please try again later.");
    } finally {
      setSubmittingRegenerate(false);
      setRegenerateDialogOpen(false);
    }
  };

  const handleDeleteSummary = async () => {
    try {
      setSubmittingDelete(true);
      await fetchGraphQL(`
        mutation DeleteSummary {
            deleteSummary(id: "${id}")
        }
    `);
      toast("Summary deleted successfully.", {
        duration: 3000,
        icon: <Trash className="h-4 w-4" />,
      });
      router.push("/dashboard/summaries");
    } catch (error) {
      setError("Failed to delete summary. Please try again later.");
      toast.error("Failed to delete summary. Please try again later.");
    } finally {
      setSubmittingDelete(false);
      setDeleteDialogOpen(false);
    }
  };

  const onSummaryExport = async () => {
    try {
      const response = await api.get(`/export/summary/${id}`, {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      });

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `summary-${id}.pdf`);

      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting summary:", error);
      toast.error("Failed to export summary. Please try again later.");
    }
  };

  const markChapterAsKnown = async (chapterIndex: number) => {
    try {
      const currentChapter = summary?.content?.chapters[chapterIndex];
      if (!currentChapter) return;

      const response = await fetchGraphQL(`
        mutation MarkChapterAsKnown {
          markChapterAsKnown(
            id: "${id}",
            chapterIndex: ${chapterIndex},
          )
        }
      `);

      if (response.markChapterAsKnown) {
        fetchSummary();
        toast.success(
          currentChapter.isKnown
            ? "Chapter unmarked"
            : "Chapter marked as known"
        );
      } else {
        toast.error("Failed to update chapter status");
      }
    } catch (error) {
      console.error("Error marking chapter:", error);
      toast.error("Failed to update chapter status");
    }
  };

  const markChapterAsImportant = async (chapterIndex: number) => {
    try {
      const currentChapter = summary?.content?.chapters[chapterIndex];
      if (!currentChapter) return;

      const response = await fetchGraphQL(`
        mutation MarkChapterAsImportant {
          markChapterAsImportant(
            id: "${id}",
            chapterIndex: ${chapterIndex},
          )
        }
      `);

      if (response.markChapterAsImportant) {
        fetchSummary();
        toast.success(
          currentChapter.isImportant
            ? "Chapter unmarked as important"
            : "Chapter marked as important"
        );
      } else {
        toast.error("Failed to update chapter importance");
      }
    } catch (error) {
      console.error("Error marking chapter as important:", error);
      toast.error("Failed to update chapter importance");
    }
  };

  const visibleChapters = summary?.content?.chapters.filter(
    (chapter) => !hideKnownChapters || !chapter.isKnown
  );

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorComponent message={error} />;
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4">
        <div className="flex flex-col md:flex-row text-center md:text-start items-center gap-4 mb-4 md:mb-0">
          <h1 className="text-2xl font-bold">{summary?.title}</h1>
          <Badge
            variant="secondary"
            className="text-xs w-fit flex items-center gap-1"
          >
            <button
              onClick={handleMaterialClick}
              className="flex items-center gap-1 text-xs hover:underline"
            >
              <ExternalLink className="inline w-3 h-3" />
              {summary?.material.title}
            </button>
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onSummaryExport}>
            Export to PDF
          </Button>
          <GenerateAssetDialog
            isOpen={regenerateDialogOpen}
            setIsOpenAction={setRegenerateDialogOpen}
            assetData={{
              title: "Summary",
              description: "Regenerate summary for this material",
              cost: 2,
            }}
            onGenerateAction={handleRegenerateSummary}
            submitting={submittingRegenerate}
            triggerText="Regenerate"
          />
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={submittingDelete}
          >
            {submittingDelete ? "Deleting..." : "Delete"}
          </Button>
          <DeleteAssetDialog
            isOpen={deleteDialogOpen}
            setIsOpenAction={setDeleteDialogOpen}
            name="summary"
            onDeleteAction={handleDeleteSummary}
            submitting={submittingDelete}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Checkbox
          id="hide-known"
          checked={hideKnownChapters}
          onCheckedChange={(checked) => setHideKnownChapters(checked === true)}
        />
        <label
          htmlFor="hide-known"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Hide known chapters
        </label>
      </div>

      {summary?.content && (
        <TableOfContents
          content={summary.content}
          onMarkAsKnown={markChapterAsKnown}
          onMarkAsImportant={markChapterAsImportant}
        />
      )}
      {summary?.content && (
        <div className="space-y-6">
          {visibleChapters &&
            visibleChapters.map((chapter, originalIndex) => {
              const chapterIndex = summary.content.chapters.findIndex(
                (c) => c.name === chapter.name
              );
              return (
                <SummaryChapter
                  chapter={chapter}
                  key={chapterIndex}
                  index={chapterIndex}
                  onMarkAsKnown={markChapterAsKnown}
                  onMarkAsImportant={markChapterAsImportant}
                />
              );
            })}
        </div>
      )}
    </div>
  );
}

export default SummaryPage;

"use client";

import MaterialFlashcards from "@/components/material-flashcards";
import MaterialQuiz from "@/components/material-quiz";
import MaterialSummary from "@/components/material-summary";
import { fetchGraphQL } from "@/utils/gql-axios";
import React, { use, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DeleteAssetDialog from "@/components/delete-asset-dialog";
import { useRouter } from "next/navigation";

function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const [material, setMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const resolvedParams = use(params);
  const { id } = resolvedParams;

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        setLoading(true);
        setError(null);

        const materialResponse = await fetchGraphQL(`
                    query GetMaterialById {
                        getMaterialById(id: "${id}") {
                            id
                            title
                            content
                            description
                            createdAt
                        }
                    }
                `);

        if (materialResponse.getMaterialById) {
          setMaterial(materialResponse.getMaterialById);
        } else {
          setError("Material not found");
        }
      } catch (error) {
        console.error("Error fetching material:", error);
        setError("Failed to fetch material. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [id]);

  const handleDeleteMaterial = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await fetchGraphQL(`
            mutation DeleteMaterial {
                deleteMaterial(id: "${id}")
            }
        `);
    } catch (error) {
      setError("Failed to delete material. Please try again later.");
    } finally {
      setSubmitting(false);
      setDeleteModalOpen(false);
      router.push("/dashboard/materials");
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading material...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>
            The requested material could not be found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">{material.title}</h1>
          {material.description && (
            <p className="text-muted-foreground mt-2">{material.description}</p>
          )}
        </div>
        <div className="flex self-center mt-2 md:self-end gap-2">
          <Button size="sm" variant="default">
            <Link href={material.content}>Download material</Link>
          </Button>
          <Button size="sm" variant="outline">
            Edit
          </Button>
          <DeleteAssetDialog
            isOpen={deleteModalOpen}
            setIsOpenAction={setDeleteModalOpen}
            onDeleteAction={handleDeleteMaterial}
            submitting={submitting}
            name="Material"
          />
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MaterialQuiz id={id} />
          <MaterialFlashcards id={id} />
        </div>

        <div className="w-full">
          <MaterialSummary id={id} />
        </div>
      </div>
    </div>
  );
}

export default MaterialPage;

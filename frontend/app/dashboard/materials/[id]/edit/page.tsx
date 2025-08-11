"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MaterialData } from "@/lib/definitions";
import { fetchGraphQL } from "@/utils/gql-axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { use, useEffect, useState } from "react";
import LoadingScreen from "@/components/common/loading-screen";
import { useForm } from "react-hook-form";
import * as z from "zod";

const materialEditSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  description: z.string().optional(),
});

type MaterialDataFormValues = z.infer<typeof materialEditSchema>;

function EditMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const [materialData, setMaterialData] =
    useState<Partial<MaterialData> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const form = useForm<MaterialDataFormValues>({
    resolver: zodResolver(materialEditSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    const fetchMaterialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const materialResponse = await fetchGraphQL(`
            query GetMaterialById {
                getMaterialById(id: "${id}") {
                    title
                    description
                }
            }
        `);

        if (materialResponse.getMaterialById) {
          setMaterialData(materialResponse.getMaterialById);
        }
      } catch {
        setError("Failed to fetch material data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchMaterialData();
  }, [id]);

  useEffect(() => {
    if (materialData) {
      form.reset({
        title: materialData.title || "",
        description: materialData.description || "",
      });
    }
  }, [materialData, form]);

  const onSubmit = async (data: MaterialDataFormValues) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await fetchGraphQL(`
            mutation UpdateMaterial {
                updateMaterial(input: { title: "${data.title}", description: "${data.description}", id: "${id}" })
            }
    `);

      setSuccess(
        "Material updated successfully. You will be redirected shortly."
      );
    } catch {
      setError("Failed to update material. Please try again later.");
    } finally {
      setSubmitting(false);
      setTimeout(() => {
        router.push(`/dashboard/materials/${id}`);
      }, 2000);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {loading && <LoadingScreen />}
      <h1 className="text-2xl font-bold mb-6">Edit Material</h1>
      <Card>
        <CardHeader>
          <CardTitle>Edit Material Details</CardTitle>
          <CardDescription>
            Update the information for the material.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default EditMaterialPage;

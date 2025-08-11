"use client";
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { fetchGraphQL } from "@/utils/gql-axios";
import { Form, FormField } from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, Dot, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

function SecondStepUpload({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      const response = await fetchGraphQL(`
        mutation CreateMaterial {
        createMaterial(input: { title: "${data.title}", id: "${id}", description: "${data.description}"}) {
          id
          title
          description
        }
      }
  `);
      if (response.createMaterial) {
        setUploadSuccess(true);
        setLoading(false);
        setTimeout(() => {
          router.push("/dashboard/materials");
        }, 2000);
      }
    } catch () {
      setLoading(false);
      setErrorMessage(
        "An error occurred while uploading the material. Please try again later."
      );
    }
  };
  return (
    <div className="container max-w-3xl py-8">
      <div className="flex items-center justify-center mb-2">
        <Dot className="h-8 w-8 text-gray-400 mr-2" />
        <Dot className="h-8 w-8 text-primary" />
      </div>
      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {uploadSuccess && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900">
          <Check className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Material uploaded successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upload Material</CardTitle>
          <CardDescription>
            Finish uploading your material by providing a title and description.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <Input {...field} placeholder="Title" className="w-full" />
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Description"
                    className="w-full"
                  />
                )}
              />

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    "Finish"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default SecondStepUpload;

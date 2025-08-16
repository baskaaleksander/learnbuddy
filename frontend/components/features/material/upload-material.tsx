"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, FileUp, Upload, Check, Loader2, Dot } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api from "@/utils/axios";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";

pdfMake.vfs = pdfFonts.vfs;

const formSchema = z
  .object({
    pdfFile: z.instanceof(File).optional(),
    textContent: z.string().optional(),
  })
  .refine((data) => data.pdfFile || data.textContent, {
    message: "Either upload a PDF or enter text",
    path: ["textContent"],
  });

function UploadMaterial() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  if (!user && !authLoading) {
    router.push("/login");
  }

  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      textContent: "",
    },
  });

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setFileName(file.name);
        form.setValue("pdfFile", file);
      } else {
        setErrorMessage("Only PDF files are allowed");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setFileName(file.name);
        form.setValue("pdfFile", file);
      } else {
        setErrorMessage("Only PDF files are allowed");
      }
    }
  };

  const createPdfFromText = async (
    text: string,
    title: string
  ): Promise<Blob> => {
    const docDefinition = {
      info: {
        title: title,
        author: user?.email || "Unknown",
        subject: "Learning Material",
        keywords: "pdf, document",
      },
      content: [{ text: text }],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          marginBottom: 10,
        },
      },
    };

    return new Promise((resolve) => {
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      pdfDocGenerator.getBlob((blob) => {
        resolve(blob);
      });
    });
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setUploading(true);
      setErrorMessage(null);

      let fileToUpload: File;

      if (data.textContent && !data.pdfFile) {
        const blob = await createPdfFromText(
          data.textContent,
          `${user?.email}-material-${Date.now().toLocaleString}.pdf`
        );
        fileToUpload = new File(
          [blob],
          `${user?.email}-material-${Date.now()}.pdf`,
          { type: "application/pdf" }
        );
      } else if (data.pdfFile) {
        fileToUpload = data.pdfFile;
      } else {
        throw new Error("No content to upload");
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);

      const upload = await api.post("/upload/", formData);

      setUploadSuccess(true);
      form.reset();
      setFileName(null);

      setTimeout(() => {
        setUploadSuccess(false);
        router.push(`/dashboard/materials/upload/${upload.data.materialId}`);
      }, 3000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      <div className="flex items-center justify-center mb-2">
        <Dot className="h-8 w-8 text-primary mr-2" />
        <Dot className="h-8 w-8 text-gray-400" />
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
            Upload a PDF file or paste text to create a new learning material.
            <span className="font-medium">
              Please make sure that it has copyable text.
            </span>
            ``
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload PDF</TabsTrigger>
                  <TabsTrigger value="text">Paste Text</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center ${
                      fileName
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 hover:border-primary/50"
                    } transition-all duration-200 cursor-pointer`}
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    <input
                      type="file"
                      id="file-upload"
                      accept="application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {fileName ? (
                      <div className="flex flex-col items-center justify-center">
                        <FileUp size={40} className="text-primary mb-2" />
                        <p className="font-medium text-lg">{fileName}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Click or drop another file to replace
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <Upload size={40} className="text-gray-400 mb-2" />
                        <p className="font-medium">
                          Drop your file here, or click to browse
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Only PDF files are supported
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="text">
                  <FormField
                    control={form.control}
                    name="textContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Text Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste or type your content here."
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-gray-500 border-t border-gray-200 pt-4">
          <p>Max file size: 10MB</p>
          <p>Supported format: PDF</p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default UploadMaterial;

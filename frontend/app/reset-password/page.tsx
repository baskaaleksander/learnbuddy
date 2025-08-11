"use client";
import DescriptionSection from "@/components/landing-page/description-section";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import api from "@/utils/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AlertBox from "@/components/common/alert-box";
import { AlertCircle, Send } from "lucide-react";
import { AxiosError } from "axios";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});
function RequestPasswordResetPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const handlePasswordResetRequest = async (
    data: z.infer<typeof formSchema>
  ) => {
    try {
      setLoading(true);
      setError(null);
      await api.post("/auth/request-password-reset", {
        email: data.email,
      });
      setSuccess("Password reset link sent to your email.");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setError(
          error.response?.data?.message ||
            "An error occurred while sending the password reset link."
        );
      }
    } finally {
      setLoading(false);
      form.reset();
    }
  };
  return (
    <div className="flex flex-col items-center justify-center px-[10%] min-h-[80vh] py-16">
      <DescriptionSection
        secondaryTitle="Password reset"
        title="Request Password Reset"
        description="Enter your email address to receive a password reset link."
      />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handlePasswordResetRequest)}
          className="w-full max-w-md mx-auto text-start pt-24"
        >
          {error && (
            <AlertBox
              title="Error"
              description={error}
              type="destructive"
              icon={<AlertCircle className="h-4 w-4" />}
            />
          )}
          {success && (
            <AlertBox
              title="Success"
              description={success}
              type="default"
              icon={<Send className="h-4 w-4" />}
            />
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full mt-6" disabled={loading}>
            {loading ? "Loading..." : "Request Password Reset"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default RequestPasswordResetPage;

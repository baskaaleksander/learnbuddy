"use client";
import api from "@/utils/axios";
import { AxiosError } from "axios";
import React, { use, useEffect, useState } from "react";

function VerifyEmail({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  const [message, setMessage] = useState<string | null>("");

  useEffect(() => {
    document.title = "Verify Email | LearnBuddy";
  }, []);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await api.post(`/auth/verify-email/${token}`);
        setMessage("Email verified successfully");
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          if (error.response?.status === 409) {
            setMessage("Email already verified");
          } else if (error.response?.status === 404) {
            setMessage("Invalid or expired token");
          } else {
            setMessage("An error occurred while verifying your email");
          }
        }
      }
    };
    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      {message}
    </div>
  );
}

export default VerifyEmail;

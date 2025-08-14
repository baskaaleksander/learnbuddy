import DescriptionSection from "@/components/landing-page/description-section";
import LoginForm from "@/components/features/auth/login-form";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | LearnBuddy",
  description: "Login to your LearnBuddy account",
};
function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center px-[10%] min-h-[80vh] py-16">
      <DescriptionSection
        title="Login"
        secondaryTitle="Authentication"
        description="Please enter your credentials to login."
      />
      <LoginForm />
    </div>
  );
}

export default LoginPage;

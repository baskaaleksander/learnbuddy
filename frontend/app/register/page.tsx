import DescriptionSection from "@/components/landing-page/description-section";
import RegisterForm from "@/components/features/auth/register-form";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | LearnBuddy",
  description: "Register for a LearnBuddy account",
};

function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center px-[10%] min-h-[80vh] py-16">
      <DescriptionSection
        title="Register"
        secondaryTitle="Authentication"
        description="Please enter your credentials to register."
      />
      <RegisterForm />
    </div>
  );
}

export default RegisterPage;

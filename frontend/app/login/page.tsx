import DescriptionSection from "@/components/landing-page/description-section";
import LoginForm from "@/components/login-form";
import React from "react";

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

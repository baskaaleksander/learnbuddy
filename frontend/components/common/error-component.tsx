import React from "react";
import { AlertCircle } from "lucide-react";

function ErrorComponent({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-red-500 mb-2">{message}</p>
        <p className="text-gray-500">Please try again later.</p>
      </div>
    </div>
  );
}

export default ErrorComponent;

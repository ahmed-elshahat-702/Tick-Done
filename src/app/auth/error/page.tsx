"use client";
import React from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

import { useSearchParams } from "next/navigation";

enum Error {
  Configuration = "Configuration",
}

const errorMap = {
  [Error.Configuration]: (
    <p>
      There was a problem when trying to authenticate. Please contact us if this
      error persists. Unique error code:{" "}
      <code className="rounded-sm bg-slate-100 p-1 text-xs">Configuration</code>
    </p>
  ),
};

const AuthErrorPage = () => {
  const search = useSearchParams();
  const error = search.get("error") as Error;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <svg
          className="mx-auto mb-4 h-12 w-12 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <line x1="15" y1="9" x2="9" y2="15" strokeWidth="2" />
          <line x1="9" y1="9" x2="15" y2="15" strokeWidth="2" />
        </svg>
        <h1 className="text-2xl font-bold text-red-600 mb-2">
          Authentication Error
        </h1>
        <p className="text-gray-700 mb-4">
          {errorMap[error] || "Please contact us if this error persists."}
        </p>
        <ul className="text-left text-gray-600 mb-6 list-disc list-inside">
          <li>Expired session</li>
          <li>Invalid credentials</li>
          <li>Network issues</li>
        </ul>
        <div className="flex flex-col gap-2">
          <Link href="/auth/signin" className={buttonVariants()}>
            Try Again
          </Link>
          <Link
            href="/"
            className="inline-block text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthErrorPage;

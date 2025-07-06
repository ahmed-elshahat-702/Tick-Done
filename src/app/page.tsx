"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TaskDashboard } from "@/components/task-dashboard";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { TaskView } from "@/components/task-view";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (
      status !== "loading" &&
      !session?.user?.id &&
      status === "unauthenticated"
    ) {
      router.push("/auth/signin");
    }
  }, [status, router, session?.user]);

  if (status === "loading") {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-500 text-lg animate-pulse">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50">
        <LoadingSpinner />
        <p className="mt-4 text-gray-500 text-lg animate-pulse">
          Redirecting to sign in...
        </p>
      </div>
    );
  }

  return (
    <TaskDashboard>
      <TaskView />
    </TaskDashboard>
  );
}

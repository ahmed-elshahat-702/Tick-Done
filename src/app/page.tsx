"use client";

// import { useEffect } from "react";
// import { useSession } from "next-auth/react";
// import { useRouter } from "next/navigation";
import { TaskDashboard } from "@/components/task-dashboard";
// import { LoadingSpinner } from "@/components/layout/loading-spinner";

export default function Home() {
  // const { status } = useSession();
  // const router = useRouter();

  // useEffect(() => {
  //   if (status === "unauthenticated") {
  //     router.push("/auth/signin");
  //   }
  // }, [status, router]);

  // if (status === "loading") {
  //   return <LoadingSpinner />;
  // }

  // if (status === "unauthenticated") {
  //   return null;
  // }

  return <TaskDashboard />;
}

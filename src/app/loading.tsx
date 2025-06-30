import { LoadingSpinner } from "@/components/layout/loading-spinner";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <LoadingSpinner className="h-8 w-8 mx-auto" />
        <p className="text-muted-foreground">Loading Tick Done...</p>
      </div>
    </div>
  );
}

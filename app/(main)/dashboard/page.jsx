import { getIndustryInsights } from "@/actions/dashboard";
import DashboardView from "./_component/dashboard-view";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// Error component
function DashboardError() {
  return (
    <div className="container mx-auto py-10">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
        <p className="mb-4">There was an error loading your industry insights.</p>
        <div className="flex gap-3">
          <a 
            href="/dashboard" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Try again
          </a>
          <a 
            href="/onboarding?mode=edit&returnTo=/dashboard" 
            className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md transition-colors"
          >
            Update your profile
          </a>
        </div>
      </div>
    </div>
  );
}

// Loading component
function DashboardLoading() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-center flex-col h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your industry insights...</p>
        <p className="text-xs text-muted-foreground mt-2">This may take a moment if we're generating new insights for you</p>
      </div>
    </div>
  );
}

// Main dashboard content
async function DashboardContent() {
  try {
    const { isOnboarded } = await getUserOnboardingStatus();

    // If not onboarded, redirect to onboarding page
    if (!isOnboarded) {
      redirect("/onboarding");
    }

    let insights = await getIndustryInsights();

    return (
      <div className="container mx-auto">
        <DashboardView insights={insights} />
      </div>
    );
  } catch (error) {
    console.error("Dashboard content error:", error);
    return <DashboardError />;
  }
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

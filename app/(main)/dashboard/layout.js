import { BarLoader } from "react-spinners";
import { Suspense } from "react";
import { Edit } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Layout({ children }) {
  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-6xl font-bold gradient-title">Industry Insights</h1>
        <Link href="/onboarding?mode=edit&returnTo=/dashboard" aria-label="Edit industry profile">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Edit className="w-5 h-5" />
          </Button>
        </Link>
      </div>
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="gray" />}
      >
        {children}
      </Suspense>
    </div>
  );
}

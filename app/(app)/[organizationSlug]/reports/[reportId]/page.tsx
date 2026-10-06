"use client";

import { useOrganization } from "@/components/organization-context";
import { ReportViewer } from "@/components/reports/report-viewer";
import { useParams, useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SingleReportPage() {
  const params = useParams();
  const router = useRouter();
  const { organizationSlug } = useOrganization();
  const reportId = params.reportId as Id<"reports">;

  if (!reportId) {
    return null;
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="print:hidden">
        <Link
          href={`/${organizationSlug}/reports`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Reports</span>
        </Link>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-6 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0">
        <ReportViewer
          reportId={reportId}
          standalone={true}
          onClose={() => router.push(`/${organizationSlug}/reports`)}
        />
      </div>
    </div>
  );
}

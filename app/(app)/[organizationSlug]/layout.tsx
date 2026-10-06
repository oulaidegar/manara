"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { OrganizationProvider } from "@/components/organization-context";
import { Loader2, ArrowLeft, ShieldAlert } from "lucide-react";
import { useState } from "react";

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const slug = params.organizationSlug as string;
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const orgData = useQuery(api.organizations.queries.getBySlug, { slug });

  if (orgData === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
          <span className="text-xs text-[var(--muted-foreground)]">Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (orgData === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 bg-[var(--background)] text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <div className="max-w-md">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Workspace unavailable</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
            The organization <span className="font-semibold text-[var(--foreground)]">&quot;{slug}&quot;</span> does not exist, was archived, or your account does not have access permissions.
          </p>
        </div>
        <button
          onClick={() => router.push("/~/select-org")}
          className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] shadow-xs hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to organizations
        </button>
      </div>
    );
  }

  return (
    <OrganizationProvider
      value={{
        organization: orgData.organization,
        organizationId: orgData.organization._id,
        organizationName: orgData.organization.name,
        organizationSlug: orgData.organization.slug,
        userRole: orgData.membership.role,
      }}
    >
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <AppSidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
        <div className="flex flex-1 flex-col lg:pl-64 transition-all duration-200">
          <AppHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </OrganizationProvider>
  );
}

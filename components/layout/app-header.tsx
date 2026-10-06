"use client";

import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useOrganization } from "@/components/organization-context";
import {
  Menu,
  Bell,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

type AppHeaderProps = {
  onMenuClick?: () => void;
};

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const pathname = usePathname();
  const { organizationName, organizationSlug, userRole } = useOrganization();
  const [showNotifications, setShowNotifications] = useState(false);

  // Derive breadcrumb / title from pathname
  const segments = pathname.split("/").filter(Boolean);
  const currentSegment = segments.length > 1 ? segments[1] : "Home";
  const title = currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 lg:px-8">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav className="flex items-center gap-1.5 text-sm">
          <span className="font-medium text-[var(--muted-foreground)]">
            {organizationName}
          </span>
          <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
          <span className="font-semibold text-[var(--foreground)]">{title}</span>
        </nav>
      </div>

      {/* Right: Freshness badge, notifications, and profile */}
      <div className="flex items-center gap-3">
        {/* Data Freshness Indicator (Section 46) */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-1 text-xs text-[var(--muted-foreground)]">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Tenant Isolated</span>
          <span className="text-[var(--border)]">|</span>
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="capitalize">{userRole}</span>
        </div>

        {/* Notifications Popover Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--accent)]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <span className="font-semibold text-sm">Notifications</span>
                <span className="text-[11px] text-[var(--muted-foreground)]">Tenant / {organizationSlug}</span>
              </div>
              <div className="py-4 text-center">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-[var(--foreground)]">All systems operational</p>
                <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                  You will receive alerts here when imports finish, team members join, or candidate outcomes need review.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-[1px] bg-[var(--border)]" />

        {/* User Identity */}
        <UserButton />
      </div>
    </header>
  );
}

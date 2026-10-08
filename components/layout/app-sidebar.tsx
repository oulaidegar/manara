"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useOrganization } from "@/components/organization-context";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Home,
  BarChart3,
  Target,
  Sparkles,
  FileText,
  Settings,
  LogOut,
  ChevronsUpDown,
  Check,
  Plus,
  X,
  Radio,
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";

type AppSidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export function AppSidebar({ isOpen = false, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { organization, organizationName, organizationSlug, userRole } = useOrganization();
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userOrganizations = useQuery(api.organizations.queries.listUserOrganizations);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOrgDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOrgSelect = (slug: string) => {
    setIsOrgDropdownOpen(false);
    if (slug !== organizationSlug) {
      router.push(`/${slug}`);
    }
  };

  const isSocialRoute = pathname.includes(`/${organizationSlug}/social`);
  const [isSocialOpen, setIsSocialOpen] = useState(true);

  const socialPlatforms = [
    { name: "Instagram", id: "instagram", href: `/${organizationSlug}/social/instagram` },
    { name: "LinkedIn", id: "linkedin", href: `/${organizationSlug}/social/linkedin` },
    { name: "TikTok", id: "tiktok", href: `/${organizationSlug}/social/tiktok` },
    { name: "YouTube", id: "youtube", href: `/${organizationSlug}/social/youtube` },
    { name: "X (Twitter)", id: "x", href: `/${organizationSlug}/social/x` },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--border)] bg-[var(--background)] transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Organization Switcher Header */}
        <div className="relative border-b border-[var(--border)] p-4" ref={dropdownRef}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsOrgDropdownOpen((prev) => !prev)}
              className="flex flex-1 items-center justify-between rounded-lg p-2 text-left hover:bg-[var(--muted)] transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)]">
                  {organizationName.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="truncate text-sm font-semibold tracking-tight text-[var(--foreground)]">
                    {organizationName}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                    <span className="capitalize">{organization.organizationType.replace("_", " ")}</span>
                    <span>•</span>
                    <span className="capitalize font-mono">{userRole}</span>
                  </div>
                </div>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
            </button>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="ml-1 rounded-md p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Org Dropdown Menu */}
          {isOrgDropdownOpen && (
            <div className="absolute left-4 right-4 top-18 z-50 rounded-lg border border-[var(--border)] bg-[var(--background)] p-1.5 shadow-lg">
              <div className="px-2 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                Organizations
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {userOrganizations?.map((org) => {
                  const isCurrent = org._id === organization._id;
                  return (
                    <button
                      key={org._id}
                      onClick={() => handleOrgSelect(org.slug)}
                      className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                        isCurrent
                          ? "bg-[var(--muted)] font-medium text-[var(--foreground)]"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate">{org.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">/{org.slug}</div>
                      </div>
                      {isCurrent && <Check className="h-4 w-4 shrink-0 text-[var(--accent)]" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-1 border-t border-[var(--border)] pt-1">
                <Link
                  href="/~/select-org"
                  onClick={() => setIsOrgDropdownOpen(false)}
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create or switch organization
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Primary Navigation - Section 4 Master Specification */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {/* Overview */}
          <Link
            href={`/${organizationSlug}`}
            onClick={onClose}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname === `/${organizationSlug}`
                ? "bg-[var(--muted)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Overview</span>
          </Link>

          {/* Social section with accordion */}
          <div className="pt-1">
            <button
              onClick={() => setIsSocialOpen(!isSocialOpen)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isSocialRoute
                  ? "text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Radio className="h-4 w-4 text-emerald-500" />
                <span>Social</span>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            </button>

            {isSocialOpen && (
              <div className="ml-5 mt-0.5 space-y-0.5 border-l border-[var(--border)] pl-2">
                {socialPlatforms.map((platform) => {
                  const isActive = pathname === platform.href;
                  return (
                    <Link
                      key={platform.id}
                      href={platform.href}
                      onClick={onClose}
                      className={`block rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-[var(--muted)] font-semibold text-[var(--foreground)]"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {platform.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Content Explorer */}
          <Link
            href={`/${organizationSlug}/content`}
            onClick={onClose}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith(`/${organizationSlug}/content`)
                ? "bg-[var(--muted)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Content</span>
          </Link>

          {/* Campaigns */}
          <Link
            href={`/${organizationSlug}/campaigns`}
            onClick={onClose}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith(`/${organizationSlug}/campaigns`) ||
              pathname.startsWith(`/${organizationSlug}/initiatives`)
                ? "bg-[var(--muted)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Target className="h-4 w-4" />
            <span>Campaigns</span>
          </Link>

          {/* Impact */}
          <Link
            href={`/${organizationSlug}/impact`}
            onClick={onClose}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith(`/${organizationSlug}/impact`)
                ? "bg-[var(--muted)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Impact</span>
          </Link>

          {/* Reports */}
          <Link
            href={`/${organizationSlug}/reports`}
            onClick={onClose}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith(`/${organizationSlug}/reports`)
                ? "bg-[var(--muted)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Reports</span>
          </Link>
        </nav>

        {/* Live sync status banner */}
        <div className="mx-3 mb-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 p-2.5 text-xs">
          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
            <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span className="font-medium text-[var(--foreground)]">System Ready</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)] leading-tight">
            Ready for communications imports and outcome logging.
          </p>
        </div>

        {/* Bottom Secondary Navigation */}
        <div className="border-t border-[var(--border)] p-3 space-y-1">
          <Link
            href={`/${organizationSlug}/settings`}
            onClick={onClose}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith(`/${organizationSlug}/settings`)
                ? "bg-[var(--muted)] text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Settings className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span>Settings</span>
          </Link>

          <SignOutButton>
            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--destructive)]">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </SignOutButton>
        </div>
      </aside>
    </>
  );
}

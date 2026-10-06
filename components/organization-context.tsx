"use client";

import { createContext, useContext, ReactNode } from "react";
import { Id, Doc } from "@/convex/_generated/dataModel";

export type OrganizationContextType = {
  organization: Doc<"organizations">;
  organizationId: Id<"organizations">;
  organizationName: string;
  organizationSlug: string;
  userRole: string;
};

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export function OrganizationProvider({
  value,
  children,
}: {
  value: OrganizationContextType;
  children: ReactNode;
}) {
  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return ctx;
}

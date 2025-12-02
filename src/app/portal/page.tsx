"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
// TEMPORARILY DISABLED - causing infinite loop
// import { usePortalActiveTab, usePortalLayoutActions } from "@/stores/portal/layout.store";
// import SetupWizard from "@/components/portal/business-setup/core/SetupOrchestrator";
// import EntitySwitcher from "@/components/portal/layout/EntitySwitcher";
import { useModal } from "@/components/providers/ModalProvider";
// import { toast } from "sonner";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";

/**
 * Portal Dashboard Page - SIMPLIFIED VERSION
 * Temporarily removed complex components to fix infinite loop
 * 
 * Disabled:
 * - Zustand store subscriptions (usePortalActiveTab, usePortalLayoutActions)
 * - EntitySwitcher (has Zustand + localStorage useEffect)
 * - SetupWizard modal
 * - Lazy-loaded tabs (use Zustand subscriptions)
 */

export default function PortalDashboardPage() {
  const { data: session } = useSession();
  const { openModal } = useModal();

  // Global search keyboard shortcut (Cmd+K / Ctrl+K)
  useKeyboardShortcut({
    id: 'dashboard-global-search',
    combo: 'Meta+k',
    description: 'Open global search',
    action: () => openModal('global-search')
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="animate-slide-in-top">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {session?.user?.name?.split(" ")[0] || "there"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 animate-slide-in-left" style={{ animationDelay: '100ms' }}>
            {/* TEMPORARILY DISABLED - Causing infinite loop
            <EntitySwitcher />
            */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openModal("global-search")}
              className="hidden sm:flex"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
              <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
        </div>
      </div>

      {/* Simplified content - tabs disabled temporarily */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to TaxHub Portal
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your professional dashboard is temporarily running in simplified mode while we fix the infinite loop issue.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            <strong>Temporarily disabled components:</strong>
          </p>
          <ul className="list-disc list-inside text-sm text-gray-500 dark:text-gray-500 mt-2">
            <li>Entity Switcher (Zustand subscriptions + localStorage causing loops)</li>
            <li>Dashboard tabs (Overview, Tasks, Compliance, Financial, Activity)</li>
            <li>Business Setup Wizard</li>
          </ul>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ✅ If you can see this page without errors, the portal layout is fixed!
              The next step is to identify which component was causing the infinite loop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for time-based greeting
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

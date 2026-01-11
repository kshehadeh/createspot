"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { Prompt } from "@/app/generated/prisma/client";
import { PromptForm } from "./prompt-form";
import { PromptSidebar } from "./prompt-sidebar";

type PromptWithSubmissionCount = Prompt & { _count: { submissions: number } };

interface AdminPromptsProps {
  prompts: PromptWithSubmissionCount[];
}

export function AdminPrompts({ prompts }: AdminPromptsProps) {
  const t = useTranslations("admin.prompts");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [showHighlight, setShowHighlight] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const filteredPrompts = useMemo(() => {
    const now = new Date();
    const sorted = [...prompts].sort(
      (a, b) =>
        new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime(),
    );

    const pastPrompts: PromptWithSubmissionCount[] = [];
    const futurePrompts: PromptWithSubmissionCount[] = [];

    for (const prompt of sorted) {
      if (new Date(prompt.weekEnd) < now) {
        pastPrompts.push(prompt);
      } else {
        futurePrompts.push(prompt);
      }
    }

    const recentPast = pastPrompts.slice(-5);
    const upcomingFuture = futurePrompts.slice(0, 5);

    return [...recentPast, ...upcomingFuture];
  }, [prompts]);

  function handleEditPrompt(promptId: string) {
    setSelectedPromptId(promptId);
    setEditingPromptId(promptId);
    setShowHighlight(true);
    setIsMobileSidebarOpen(false); // Close mobile sidebar when editing
    setTimeout(() => setShowHighlight(false), 2000);
  }

  function handleSelectionHandled() {
    setSelectedPromptId(null);
  }

  function handleFormModeChange(mode: "create" | "edit", promptId?: string) {
    if (mode === "create") {
      setEditingPromptId(null);
    } else if (promptId) {
      setEditingPromptId(promptId);
    }
  }

  // Close mobile sidebar when editing starts
  useEffect(() => {
    if (editingPromptId) {
      setIsMobileSidebarOpen(false);
    }
  }, [editingPromptId]);

  return (
    <>
      <div className="flex gap-8">
        <section
          id="prompt-form-section"
          className={`flex-1 rounded-3xl bg-card p-8 ${
            filteredPrompts.length > 0 ? "pb-24 md:pb-8" : ""
          } ${showHighlight ? "animate-glow-pulse" : ""}`}
        >
          <h2 className="mb-6 text-2xl font-semibold text-foreground">
            {t("title")}
          </h2>
          <PromptForm
            prompts={prompts}
            externalSelectedPromptId={selectedPromptId}
            onSelectionHandled={handleSelectionHandled}
            onModeChange={handleFormModeChange}
          />
        </section>

        {filteredPrompts.length > 0 && (
          <>
            {/* Desktop Sidebar */}
            <aside className="hidden w-72 shrink-0 md:block">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {t("recentUpcoming")}
              </h2>
              <PromptSidebar
                prompts={filteredPrompts}
                onEditPrompt={handleEditPrompt}
                editingPromptId={editingPromptId}
              />
            </aside>

            {/* Mobile Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
              <div
                className={`flex flex-col overflow-hidden border-t border-border bg-card shadow-2xl transition-all duration-200 ease-out ${
                  isMobileSidebarOpen ? "max-h-[600px]" : "max-h-20"
                }`}
              >
                {/* Collapsed Bar / Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
                  {!isMobileSidebarOpen ? (
                    <>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-foreground">
                          {t("recentUpcoming")}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {t("promptCount", { count: filteredPrompts.length })}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="p-2 text-muted-foreground"
                        aria-label={t("expandSidebar")}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">
                        {t("recentUpcoming")}
                      </h2>
                      <button
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="rounded-full p-2 text-muted-foreground hover:bg-accent"
                        aria-label={t("closeSidebar")}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Expanded Content */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <PromptSidebar
                    prompts={filteredPrompts}
                    onEditPrompt={handleEditPrompt}
                    editingPromptId={editingPromptId}
                  />
                </div>
              </div>
            </div>

            {/* Mobile Overlay */}
            <div
              className={`fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 md:hidden ${
                isMobileSidebarOpen
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          </>
        )}
      </div>
    </>
  );
}

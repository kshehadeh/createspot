"use client";

import { useState, useMemo } from "react";
import type { Prompt } from "@/app/generated/prisma/client";
import { PromptForm } from "./prompt-form";
import { PromptSidebar } from "./prompt-sidebar";

type PromptWithSubmissionCount = Prompt & { _count: { submissions: number } };

interface AdminPromptsProps {
  prompts: PromptWithSubmissionCount[];
}

export function AdminPrompts({ prompts }: AdminPromptsProps) {
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [showHighlight, setShowHighlight] = useState(false);

  const filteredPrompts = useMemo(() => {
    const now = new Date();
    const sorted = [...prompts].sort((a, b) => 
      new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
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

  return (
    <div className="flex gap-8">
      <section 
        id="prompt-form-section" 
        className={`flex-1 rounded-3xl p-8 ${
          showHighlight 
            ? "animate-glow-pulse" 
            : ""
        }`}
      >
        <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-white">
          Manage Prompts
        </h2>
        <PromptForm 
          prompts={prompts} 
          externalSelectedPromptId={selectedPromptId}
          onSelectionHandled={handleSelectionHandled}
          onModeChange={handleFormModeChange}
        />
      </section>

      {filteredPrompts.length > 0 && (
        <aside className="w-72 shrink-0">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
            Recent & Upcoming
          </h2>
          <PromptSidebar 
            prompts={filteredPrompts} 
            onEditPrompt={handleEditPrompt}
            editingPromptId={editingPromptId}
          />
        </aside>
      )}
    </div>
  );
}

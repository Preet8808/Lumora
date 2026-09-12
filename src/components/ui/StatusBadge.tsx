"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Clock, Inbox, Play, Archive, BookOpen } from "lucide-react";

export type ItemStatus = "INBOX" | "WANT_TO_READ" | "IN_PROGRESS" | "FINISHED" | "ARCHIVED";

interface StatusBadgeProps {
  status: ItemStatus | string;
  onStatusChange?: (newStatus: ItemStatus) => void;
  interactive?: boolean;
  className?: string;
}

const statusConfig: Record<
  ItemStatus,
  { label: string; icon: React.ElementType; color: string; border: string; bg: string }
> = {
  INBOX: {
    label: "Inbox",
    icon: Inbox,
    color: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/10",
  },
  WANT_TO_READ: {
    label: "To Read",
    icon: BookOpen,
    color: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/10",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Play,
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/10",
  },
  FINISHED: {
    label: "Finished",
    icon: Check,
    color: "text-purple-400",
    border: "border-purple-500/20",
    bg: "bg-purple-500/10",
  },
  ARCHIVED: {
    label: "Archived",
    icon: Archive,
    color: "text-zinc-400",
    border: "border-zinc-500/20",
    bg: "bg-zinc-500/10",
  },
};

export function StatusBadge({
  status,
  onStatusChange,
  interactive = true,
  className,
}: StatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentKey = (status as ItemStatus) in statusConfig ? (status as ItemStatus) : "INBOX";
  const current = statusConfig[currentKey];
  const Icon = current.icon;

  if (!interactive || !onStatusChange) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
          current.bg,
          current.color,
          current.border,
          className
        )}
      >
        <Icon className="w-3 h-3" />
        {current.label}
      </span>
    );
  }

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:opacity-90 active:scale-95 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500",
          current.bg,
          current.color,
          current.border,
          className
        )}
        title="Change status"
      >
        <Icon className="w-3 h-3" />
        <span>{current.label}</span>
        <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-0.5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1.5 w-36 rounded-xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-md shadow-2xl z-50 p-1 divide-y divide-zinc-800/50">
            {(Object.keys(statusConfig) as ItemStatus[]).map((key) => {
              const option = statusConfig[key];
              const OptionIcon = option.icon;
              const isSelected = key === currentKey;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onStatusChange(key);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left",
                    isSelected
                      ? "bg-zinc-800/80 text-white"
                      : "text-zinc-300 hover:bg-zinc-800/50 hover:text-white"
                  )}
                >
                  <OptionIcon className={cn("w-3.5 h-3.5", option.color)} />
                  <span className="flex-1">{option.label}</span>
                  {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  name: string;
  color?: string | null;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
  size?: "sm" | "md";
}

export function TagBadge({
  name,
  color,
  onClick,
  onRemove,
  className,
  size = "sm",
}: TagBadgeProps) {
  const formattedName = name.startsWith("#") ? name : `#${name}`;

  return (
    <span
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium transition-all",
        size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        "bg-zinc-800/60 text-zinc-300 border border-zinc-700/40",
        onClick && "hover:bg-zinc-700/60 hover:text-white cursor-pointer",
        className
      )}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color || "#6366f1" }}
      />
      <span>{formattedName}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:text-red-400 text-zinc-400 focus:outline-none"
        >
          ×
        </button>
      )}
    </span>
  );
}

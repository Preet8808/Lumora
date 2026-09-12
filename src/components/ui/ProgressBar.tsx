"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number;
  onProgressChange?: (newProgress: number) => void;
  showText?: boolean;
  interactive?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function ProgressBar({
  progress,
  onProgressChange,
  showText = true,
  interactive = false,
  className,
  size = "md",
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onProgressChange) {
      onProgressChange(parseInt(e.target.value, 10));
    }
  };

  return (
    <div className={cn("flex items-center gap-2 w-full", className)} onClick={(e) => e.stopPropagation()}>
      <div className="relative flex-1 flex items-center">
        <div
          className={cn(
            "w-full bg-zinc-800/80 rounded-full overflow-hidden relative",
            size === "sm" ? "h-1.5" : "h-2"
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              clampedProgress >= 100
                ? "bg-purple-500"
                : clampedProgress > 0
                ? "bg-indigo-500"
                : "bg-zinc-700"
            )}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>

        {interactive && onProgressChange && (
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={clampedProgress}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full z-10"
            title={`Progress: ${clampedProgress}% (click or drag to change)`}
          />
        )}
      </div>

      {showText && (
        <span className="text-[11px] font-mono font-medium text-zinc-400 tabular-nums shrink-0">
          {clampedProgress}%
        </span>
      )}
    </div>
  );
}

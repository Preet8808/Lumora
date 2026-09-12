"use client";

import React, { useState } from "react";
import { Archive, Check, Trash2, Tag as TagIcon, X } from "lucide-react";
import { ItemStatus } from "@/components/ui/StatusBadge";

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkArchive: () => void;
  onBulkStatus: (status: ItemStatus) => void;
  onBulkDelete: () => void;
  onBulkAddTag?: (tagId: string) => void;
  availableTags?: Array<{ id: string; name: string }>;
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onBulkArchive,
  onBulkStatus,
  onBulkDelete,
  onBulkAddTag,
  availableTags = [],
}: BulkActionBarProps) {
  const [showTagMenu, setShowTagMenu] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="pointer-events-auto flex items-center gap-2 md:gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900/95 border border-zinc-700/80 shadow-2xl shadow-black/80 backdrop-blur-xl text-zinc-200 text-sm">
        <span className="font-semibold px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs border border-indigo-500/30">
          {selectedCount} selected
        </span>

        <div className="h-4 w-px bg-zinc-700 mx-1" />

        {/* Mark Finished */}
        <button
          type="button"
          onClick={() => onBulkStatus("FINISHED")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs font-medium"
          title="Mark finished"
        >
          <Check className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Mark Finished</span>
        </button>

        {/* Archive */}
        <button
          type="button"
          onClick={onBulkArchive}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs font-medium"
          title="Archive selected"
        >
          <Archive className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Archive</span>
        </button>

        {/* Add Tag Dropdown */}
        {onBulkAddTag && availableTags.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTagMenu(!showTagMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs font-medium"
              title="Add tag"
            >
              <TagIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Add Tag</span>
            </button>

            {showTagMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowTagMenu(false)}
                />
                <div className="absolute bottom-full mb-2 left-0 w-44 max-h-48 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-1 shadow-xl z-50 divide-y divide-zinc-800/40">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        onBulkAddTag(tag.id);
                        setShowTagMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Delete */}
        <button
          type="button"
          onClick={onBulkDelete}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer text-xs font-medium"
          title="Delete selected"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Delete</span>
        </button>

        <div className="h-4 w-px bg-zinc-700 mx-1" />

        {/* Clear selection */}
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

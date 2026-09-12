"use client";

import React, { useState } from "react";
import { ItemWithDetails } from "@/lib/services/items.service";
import { SavedItemCard } from "@/components/items/SavedItemCard";
import { BulkActionBar } from "@/components/items/BulkActionBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ItemStatus } from "@/components/ui/StatusBadge";
import {
  Inbox,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  CheckSquare,
  Square,
  Sparkles,
  Star,
  Play,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InboxClientProps {
  initialItems: ItemWithDetails[];
  availableTags: Array<{ id: string; name: string }>;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: "inbox" | "star" | "play" | "archive";
}

export function InboxClient({
  initialItems,
  availableTags,
  emptyTitle,
  emptyDescription,
  emptyIcon = "inbox",
}: InboxClientProps) {
  const [items, setItems] = useState<ItemWithDetails[]>(initialItems);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"savedAt" | "title" | "progress">("savedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection logic
  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const handleSelectItem = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  // Status & Card updates
  const updateItemInState = (itemId: string, updates: Partial<ItemWithDetails>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, ...updates } : i))
    );
  };

  const handleStatusChange = async (itemId: string, newStatus: ItemStatus) => {
    // If status changed away from INBOX, remove or update in state
    updateItemInState(itemId, { status: newStatus });
    try {
      await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleFavoriteToggle = async (itemId: string, currentFav: boolean) => {
    updateItemInState(itemId, { isFavorite: !currentFav });
    try {
      await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !currentFav }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleProgressChange = async (itemId: string, newProgress: number) => {
    updateItemInState(itemId, { progress: newProgress });
    try {
      await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: newProgress }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk operations
  const handleBulkArchive = async () => {
    try {
      await fetch("/api/items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive", itemIds: selectedIds }),
      });
      setItems((prev) => prev.filter((i) => !selectedIds.includes(i.id)));
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkStatus = async (status: ItemStatus) => {
    try {
      await fetch("/api/items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", itemIds: selectedIds, status }),
      });
      setItems((prev) =>
        prev.map((i) => (selectedIds.includes(i.id) ? { ...i, status } : i))
      );
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await fetch("/api/items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", itemIds: selectedIds }),
      });
      setItems((prev) => prev.filter((i) => !selectedIds.includes(i.id)));
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkAddTag = async (tagId: string) => {
    try {
      await fetch("/api/items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addTag", itemIds: selectedIds, tagId }),
      });
      const tagObj = availableTags.find((t) => t.id === tagId);
      if (tagObj) {
        setItems((prev) =>
          prev.map((i) =>
            selectedIds.includes(i.id) && !i.tags.some((t) => t.id === tagId)
              ? { ...i, tags: [...i.tags, { ...tagObj, color: "#6366f1" }] }
              : i
          )
        );
      }
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
    }
  };

  // Filter & Sort
  const filteredItems = items
    .filter((item) => (typeFilter ? item.type === typeFilter : true))
    .sort((a, b) => {
      if (sortBy === "title") {
        return sortOrder === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      if (sortBy === "progress") {
        return sortOrder === "asc" ? a.progress - b.progress : b.progress - a.progress;
      }
      return sortOrder === "asc"
        ? new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
        : new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });

  return (
    <div className="space-y-6">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Inbox</h1>
            <span className="text-xs font-mono text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
              {filteredItems.length}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Process, tag, and read your recently captured links
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Select all toggle button */}
          {items.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 text-xs text-zinc-300 transition-colors cursor-pointer"
            >
              {isAllSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <span>Select all</span>
            </button>
          )}

          {/* Type Filter Dropdown */}
          <select
            value={typeFilter || ""}
            onChange={(e) => setTypeFilter(e.target.value || null)}
            aria-label="Filter items by content type"
            className="px-2.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="youtube">YouTube</option>
            <option value="github">GitHub</option>
            <option value="reddit">Reddit</option>
            <option value="article">Articles</option>
            <option value="website">Websites</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-") as [any, any];
              setSortBy(sb);
              setSortOrder(so);
            }}
            aria-label="Sort items by order"
            className="px-2.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="savedAt-desc">Newest First</option>
            <option value="savedAt-asc">Oldest First</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="progress-desc">Highest Progress</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900/80 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer",
                viewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer",
                viewMode === "list" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Items List / Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={
            emptyIcon === "star"
              ? Star
              : emptyIcon === "play"
              ? Play
              : emptyIcon === "archive"
              ? Archive
              : Inbox
          }
          title={emptyTitle || "Inbox Zero"}
          description={
            emptyDescription ||
            "You've processed all your saved items! Paste a new link with the 'N' key or discover items from your archives."
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <SavedItemCard
              key={item.id}
              item={item}
              selected={selectedIds.includes(item.id)}
              onSelect={(sel) => handleSelectItem(item.id, sel)}
              onStatusChange={(s) => handleStatusChange(item.id, s)}
              onFavoriteToggle={() => handleFavoriteToggle(item.id, item.isFavorite)}
              onProgressChange={(p) => handleProgressChange(item.id, p)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <SavedItemCard
              key={item.id}
              item={item}
              selected={selectedIds.includes(item.id)}
              onSelect={(sel) => handleSelectItem(item.id, sel)}
              onStatusChange={(s) => handleStatusChange(item.id, s)}
              onFavoriteToggle={() => handleFavoriteToggle(item.id, item.isFavorite)}
              onProgressChange={(p) => handleProgressChange(item.id, p)}
              viewMode="list"
            />
          ))}
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkArchive={handleBulkArchive}
        onBulkStatus={handleBulkStatus}
        onBulkDelete={handleBulkDelete}
        onBulkAddTag={handleBulkAddTag}
        availableTags={availableTags}
      />
    </div>
  );
}

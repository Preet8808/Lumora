"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ItemWithDetails } from "@/lib/services/items.service";
import { SavedItemCard } from "@/components/items/SavedItemCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ItemStatus } from "@/components/ui/StatusBadge";
import {
  Play,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Flame,
  Bookmark,
  CheckCircle2,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface DashboardClientProps {
  initialContinueItems: ItemWithDetails[];
  initialRecentItems: ItemWithDetails[];
  initialQuickWins: ItemWithDetails[];
  initialRecommendations: ItemWithDetails[];
}

export function DashboardClient({
  initialContinueItems,
  initialRecentItems,
  initialQuickWins,
  initialRecommendations,
}: DashboardClientProps) {
  const [continueItems, setContinueItems] = useState(initialContinueItems);
  const [recentItems, setRecentItems] = useState(initialRecentItems);
  const [quickWins, setQuickWins] = useState(initialQuickWins);
  const [recommendations, setRecommendations] = useState(initialRecommendations);

  const updateItemInState = (
    itemId: string,
    updates: Partial<ItemWithDetails>
  ) => {
    const updater = (list: ItemWithDetails[]) =>
      list.map((item) => (item.id === itemId ? { ...item, ...updates } : item));

    setContinueItems(updater);
    setRecentItems(updater);
    setQuickWins(updater);
    setRecommendations(updater);
  };

  const handleStatusChange = async (itemId: string, newStatus: ItemStatus) => {
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

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      {/* 1. Continue Section (High-priority workspace feature) */}
      {continueItems.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Play className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
                Continue Consuming
              </h2>
            </div>
            <Link
              href="/continue"
              className="text-xs text-zinc-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {continueItems.map((item) => (
              <div
                key={item.id}
                className="group p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div className="flex gap-4">
                  {item.thumbnailUrl && (
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      className="w-24 h-16 object-cover rounded-xl shrink-0 border border-zinc-800"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                      <span className="capitalize font-medium">{item.type}</span>
                      <span>•</span>
                      <span>{formatDuration(item.duration, item.type) || item.domain}</span>
                    </div>
                    <Link href={`/item/${item.id}`}>
                      <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-indigo-300 truncate">
                        {item.title}
                      </h3>
                    </Link>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-4">
                  <div className="flex-1 max-w-xs">
                    <ProgressBar
                      progress={item.progress}
                      onProgressChange={(p) => handleProgressChange(item.id, p)}
                      interactive={true}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/item/${item.id}`}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                    >
                      Details
                    </Link>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Continue</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. Recently Saved */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Bookmark className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Recently Saved
            </h2>
          </div>
          <Link
            href="/inbox"
            className="text-xs text-zinc-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
          >
            <span>Go to Inbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-zinc-800 text-center text-sm text-zinc-500">
            No items saved yet. Press <kbd>N</kbd> or click &ldquo;Save something&rdquo; to add your first item!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentItems.slice(0, 6).map((item) => (
              <SavedItemCard
                key={item.id}
                item={item}
                onStatusChange={(s) => handleStatusChange(item.id, s)}
                onFavoriteToggle={() => handleFavoriteToggle(item.id, item.isFavorite)}
                onProgressChange={(p) => handleProgressChange(item.id, p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Quick Wins (<= 15 min content) */}
      {quickWins.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
                Quick Wins
              </h2>
              <span className="text-xs text-zinc-500 hidden sm:inline">
                (Short content under 15 minutes)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickWins.map((item) => (
              <SavedItemCard
                key={item.id}
                item={item}
                onStatusChange={(s) => handleStatusChange(item.id, s)}
                onFavoriteToggle={() => handleFavoriteToggle(item.id, item.isFavorite)}
                onProgressChange={(p) => handleProgressChange(item.id, p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Recommended (Deterministic Heuristics) */}
      {recommendations.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
                Recommended For You
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((item) => (
              <SavedItemCard
                key={item.id}
                item={item}
                onStatusChange={(s) => handleStatusChange(item.id, s)}
                onFavoriteToggle={() => handleFavoriteToggle(item.id, item.isFavorite)}
                onProgressChange={(p) => handleProgressChange(item.id, p)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

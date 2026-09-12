"use client";

import React from "react";
import Link from "next/link";
import { cn, formatTimeAgo, formatDuration } from "@/lib/utils";
import { ItemWithDetails } from "@/lib/services/items.service";
import { StatusBadge, ItemStatus } from "@/components/ui/StatusBadge";
import { TagBadge } from "@/components/ui/TagBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  Star,
  ExternalLink,
  MessageSquare,
  BookOpen,
  Globe,
  Archive,
  Check,
  Play,
} from "lucide-react";
import { YoutubeIcon, GithubIcon } from "@/components/ui/Icons";

interface SavedItemCardProps {
  item: ItemWithDetails;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  onStatusChange?: (newStatus: ItemStatus) => void;
  onFavoriteToggle?: () => void;
  onProgressChange?: (newProgress: number) => void;
  onTagClick?: (tagId: string) => void;
  viewMode?: "grid" | "list";
}

export function SavedItemCard({
  item,
  selected = false,
  onSelect,
  onStatusChange,
  onFavoriteToggle,
  onProgressChange,
  onTagClick,
  viewMode = "grid",
}: SavedItemCardProps) {
  const getTypeIcon = () => {
    switch (item.type) {
      case "youtube":
        return <YoutubeIcon className="w-3.5 h-3.5 text-red-500" />;
      case "github":
        return <GithubIcon className="w-3.5 h-3.5 text-zinc-300" />;
      case "reddit":
        return <MessageSquare className="w-3.5 h-3.5 text-orange-400" />;
      case "article":
        return <BookOpen className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const formattedDuration = formatDuration(item.duration, item.type);

  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "group relative flex items-center gap-4 p-3 rounded-xl border transition-all duration-200",
          selected
            ? "bg-indigo-950/20 border-indigo-500/50"
            : "bg-zinc-900/40 border-zinc-800/70 hover:border-zinc-700/80 hover:bg-zinc-900/80"
        )}
      >
        {/* Bulk select checkbox */}
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-850 text-indigo-600 focus:ring-indigo-500/40 cursor-pointer"
          />
        )}

        {/* Thumbnail or Icon */}
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-zinc-800 relative flex items-center justify-center">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            getTypeIcon()
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
              {item.faviconUrl && (
                <img
                  src={item.faviconUrl}
                  alt=""
                  className="w-3.5 h-3.5 rounded-sm"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              )}
              <span>{item.domain}</span>
            </span>
            <span className="text-zinc-600 text-xs">•</span>
            <span className="text-xs text-zinc-500">{formatTimeAgo(item.savedAt)}</span>
            {formattedDuration && (
              <>
                <span className="text-zinc-600 text-xs">•</span>
                <span className="text-xs text-zinc-400 font-medium">{formattedDuration}</span>
              </>
            )}
          </div>

          <Link href={`/item/${item.id}`} className="block group-hover:text-indigo-300 transition-colors">
            <h4 className="text-sm font-semibold text-zinc-100 truncate">{item.title}</h4>
          </Link>

          {item.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {item.tags.slice(0, 3).map((tag) => (
                <TagBadge
                  key={tag.id}
                  name={tag.name}
                  color={tag.color}
                  onClick={() => onTagClick?.(tag.id)}
                />
              ))}
              {item.tags.length > 3 && (
                <span className="text-[10px] text-zinc-500">+{item.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Status & Progress */}
        <div className="flex items-center gap-3 shrink-0">
          {item.progress > 0 && (
            <div className="w-24 hidden md:block">
              <ProgressBar
                progress={item.progress}
                onProgressChange={onProgressChange}
                interactive={!!onProgressChange}
                size="sm"
              />
            </div>
          )}

          <StatusBadge status={item.status} onStatusChange={onStatusChange} />

          {/* Favorite Star */}
          {onFavoriteToggle && (
            <button
              type="button"
              onClick={onFavoriteToggle}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer",
                item.isFavorite
                  ? "text-amber-400 hover:text-amber-300"
                  : "text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100"
              )}
              title={item.isFavorite ? "Remove favorite" : "Mark as favorite"}
            >
              <Star className={cn("w-4 h-4", item.isFavorite && "fill-amber-400")} />
            </button>
          )}

          {/* Open Original Link */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors opacity-0 group-hover:opacity-100"
            title="Open original website"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  // Default Grid View
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 overflow-hidden",
        selected
          ? "bg-indigo-950/20 border-indigo-500/50 shadow-lg shadow-indigo-950/30"
          : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700/90 hover:bg-zinc-900/70 hover:shadow-xl hover:shadow-black/40"
      )}
    >
      {/* Top Banner / Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-950/80 border-b border-zinc-800/60">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-zinc-600">
            {getTypeIcon()}
            <span className="text-xs font-mono uppercase tracking-wider mt-2 opacity-60">
              {item.type}
            </span>
          </div>
        )}

        {/* Top Badges Overlay */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {onSelect && (
              <div className="bg-zinc-950/80 backdrop-blur-md p-1 rounded-md border border-zinc-800">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => onSelect(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-850 text-indigo-600 focus:ring-indigo-500/40 cursor-pointer block"
                />
              </div>
            )}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-950/85 backdrop-blur-md text-zinc-300 border border-zinc-800 shadow-sm">
              {getTypeIcon()}
              <span className="capitalize">{item.type}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 pointer-events-auto">
            {formattedDuration && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-950/85 backdrop-blur-md text-zinc-300 border border-zinc-800 shadow-sm">
                {formattedDuration}
              </span>
            )}
            {onFavoriteToggle && (
              <button
                type="button"
                onClick={onFavoriteToggle}
                className={cn(
                  "p-1.5 rounded-full backdrop-blur-md border border-zinc-800 transition-all cursor-pointer",
                  item.isFavorite
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    : "bg-zinc-950/80 text-zinc-400 hover:text-zinc-100"
                )}
                title={item.isFavorite ? "Remove favorite" : "Mark as favorite"}
              >
                <Star className={cn("w-3.5 h-3.5", item.isFavorite && "fill-amber-400")} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Domain & Saved Time */}
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
              {item.faviconUrl && (
                <img
                  src={item.faviconUrl}
                  alt=""
                  className="w-3.5 h-3.5 rounded-sm"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              )}
              <span className="truncate max-w-[140px]">{item.domain}</span>
            </span>
            <span className="text-zinc-600 text-xs">•</span>
            <span className="text-xs text-zinc-500">{formatTimeAgo(item.savedAt)}</span>
          </div>

          {/* Title */}
          <Link href={`/item/${item.id}`} className="block group-hover:text-indigo-400 transition-colors">
            <h4 className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2 mb-1.5">
              {item.title}
            </h4>
          </Link>

          {/* Description */}
          {item.description && (
            <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              {item.tags.map((tag) => (
                <TagBadge
                  key={tag.id}
                  name={tag.name}
                  color={tag.color}
                  onClick={() => onTagClick?.(tag.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Card Footer: Progress & Quick Actions */}
        <div className="pt-3 border-t border-zinc-800/60 mt-2 space-y-2.5">
          {/* Progress bar if applicable */}
          {(item.progress > 0 || item.status === "IN_PROGRESS") && (
            <ProgressBar
              progress={item.progress}
              onProgressChange={onProgressChange}
              interactive={!!onProgressChange}
              size="sm"
            />
          )}

          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={item.status} onStatusChange={onStatusChange} />

            <div className="flex items-center gap-1">
              {/* Quick Status Buttons */}
              {item.status !== "FINISHED" && onStatusChange && (
                <button
                  type="button"
                  onClick={() => onStatusChange("FINISHED")}
                  className="p-1 rounded-md text-zinc-500 hover:text-purple-400 hover:bg-zinc-800/60 transition-colors"
                  title="Mark finished"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}

              {item.status !== "ARCHIVED" && onStatusChange && (
                <button
                  type="button"
                  onClick={() => onStatusChange("ARCHIVED")}
                  className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                  title="Archive item"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
              )}

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
                title="Open original link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

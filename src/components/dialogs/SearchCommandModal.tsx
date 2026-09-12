"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  MessageSquare,
  BookOpen,
  Globe,
  Star,
  ExternalLink,
  Loader2,
  Tag as TagIcon,
  Filter,
} from "lucide-react";
import { YoutubeIcon, GithubIcon } from "@/components/ui/Icons";
import { SearchResultItem } from "@/lib/services/search.service";
import { TagBadge } from "@/components/ui/TagBadge";
import { cn } from "@/lib/utils";

interface SearchCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchCommandModal({ isOpen, onClose }: SearchCommandModalProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      handleSearch("", typeFilter, statusFilter);
    } else {
      setQuery("");
      setTypeFilter(null);
      setStatusFilter(null);
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSearch = async (
    searchQuery: string,
    type?: string | null,
    status?: string | null
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (type) params.set("type", type);
      if (status) params.set("status", status);

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setSelectedIndex(0);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      handleSearch(query, typeFilter, statusFilter);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, typeFilter, statusFilter]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        results.length > 0 ? (prev - 1 + results.length) % results.length : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        router.push(`/item/${results[selectedIndex].id}`);
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "youtube":
        return <YoutubeIcon className="w-4 h-4 text-red-500" />;
      case "github":
        return <GithubIcon className="w-4 h-4 text-zinc-300" />;
      case "reddit":
        return <MessageSquare className="w-4 h-4 text-orange-400" />;
      case "article":
        return <BookOpen className="w-4 h-4 text-blue-400" />;
      default:
        return <Globe className="w-4 h-4 text-zinc-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl z-10 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 fade-in duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-900/40">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search titles, notes, tags, domains, collections..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin shrink-0" />}
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd>esc</kbd>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-zinc-800/50 bg-zinc-950/60 overflow-x-auto text-xs no-scrollbar">
          <span className="text-zinc-500 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>

          <button
            type="button"
            onClick={() => setTypeFilter(null)}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer",
              typeFilter === null
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            )}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter(typeFilter === "article" ? null : "article")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer",
              typeFilter === "article"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            )}
          >
            <BookOpen className="w-3 h-3 text-blue-400" />
            <span>Articles</span>
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter(typeFilter === "youtube" ? null : "youtube")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer",
              typeFilter === "youtube"
                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            )}
          >
            <YoutubeIcon className="w-3.5 h-3.5 text-red-500" />
            <span>YouTube</span>
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter(typeFilter === "github" ? null : "github")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer",
              typeFilter === "github"
                ? "bg-zinc-700 text-white border border-zinc-600"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            )}
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter(typeFilter === "reddit" ? null : "reddit")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer",
              typeFilter === "reddit"
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            )}
          >
            <MessageSquare className="w-3 h-3 text-orange-400" />
            <span>Reddit</span>
          </button>

          <div className="h-3 w-px bg-zinc-800 mx-1" />

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "IN_PROGRESS" ? null : "IN_PROGRESS")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer",
              statusFilter === "IN_PROGRESS"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            )}
          >
            In Progress
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-zinc-900/60 max-h-[50vh]">
          {results.length === 0 && !loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    router.push(`/item/${item.id}`);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                    isSelected
                      ? "bg-zinc-850 text-white"
                      : "text-zinc-300 hover:bg-zinc-900/60"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700/40">
                    {getTypeIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-zinc-400">{item.domain}</span>
                      {item.isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      <span className="text-[10px] text-zinc-500 px-1.5 py-0.2 rounded bg-zinc-800/80 uppercase">
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <h4 className="text-xs md:text-sm font-medium text-zinc-100 truncate">
                      {item.title}
                    </h4>

                    {item.matchSnippet && (
                      <p className="text-[11px] text-indigo-400/90 font-mono line-clamp-1 mt-0.5">
                        {item.matchSnippet}
                      </p>
                    )}

                    {item.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {item.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="text-[10px] text-zinc-400 font-mono px-1 rounded bg-zinc-800/50"
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isSelected && (
                      <span className="text-[10px] text-zinc-500 hidden sm:inline font-mono">
                        Press Enter ↵
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-zinc-800/60 bg-zinc-900/30 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> Navigate
            </span>
            <span>
              <kbd>↵</kbd> Select
            </span>
            <span>
              <kbd>esc</kbd> Dismiss
            </span>
          </div>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  );
}

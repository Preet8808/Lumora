"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Link as LinkIcon,
  Loader2,
  Check,
  Sparkles,
  ExternalLink,
  Plus,
  Folder,
} from "lucide-react";
import { ExtractedMetadata } from "@/lib/metadata/extractor";
import { ItemStatus, StatusBadge } from "@/components/ui/StatusBadge";
import { TagBadge } from "@/components/ui/TagBadge";

interface QuickSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemSaved?: (item: any) => void;
}

export function QuickSaveModal({ isOpen, onClose, onItemSaved }: QuickSaveModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<ExtractedMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ItemStatus>("INBOX");
  const [isFavorite, setIsFavorite] = useState(false);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      // Reset state on close
      setUrl("");
      setMetadata(null);
      setError(null);
      setTitle("");
      setDescription("");
      setStatus("INBOX");
      setIsFavorite(false);
      setNote("");
      setTags([]);
      setTagInput("");
      setSaving(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleFetchMetadata = async (targetUrl?: string) => {
    const urlToFetch = targetUrl || url;
    if (!urlToFetch.trim()) return;

    let normalized = urlToFetch.trim();
    if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
      normalized = "https://" + normalized;
      setUrl(normalized);
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      });

      const data = await res.json();

      if (data.metadata) {
        setMetadata(data.metadata);
        setTitle(data.metadata.title || "");
        setDescription(data.metadata.description || "");
      } else if (data.fallback) {
        // Graceful fallback
        setTitle(new URL(normalized).hostname);
        setDescription("");
      } else if (data.error) {
        setError(data.error);
        setTitle(new URL(normalized).hostname);
      }
    } catch (err: any) {
      console.warn("Metadata error:", err);
      setError("Could not automatically fetch metadata. You can enter details manually.");
      try {
        setTitle(new URL(normalized).hostname);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setSaving(true);
    setError(null);

    try {
      let finalUrl = url.trim();
      if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
        finalUrl = "https://" + finalUrl;
      }

      let domain = "website";
      try {
        domain = new URL(finalUrl).hostname.replace(/^www\./, "");
      } catch {}

      const payload = {
        url: finalUrl,
        title: title.trim() || metadata?.title || domain,
        description: description.trim() || metadata?.description || "",
        domain: metadata?.domain || domain,
        type: metadata?.type || "website",
        thumbnailUrl: metadata?.thumbnailUrl || null,
        faviconUrl: metadata?.faviconUrl || null,
        author: metadata?.author || null,
        duration: metadata?.duration || null,
        status,
        isFavorite,
        tagNames: tags,
        note: note.trim() || undefined,
      };

      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save item");
      }

      if (onItemSaved) {
        onItemSaved(data.item);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save item");
      setSaving(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, "");
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setTagInput("");
      }
    }
  };

  const removeTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl z-10 animate-in zoom-in-95 fade-in duration-200"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            handleSave();
          }
          if (e.key === "Escape") {
            onClose();
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Save It For Later</h3>
              <p className="text-xs text-zinc-400">Paste any link from the internet</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">URL</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="https://github.com/..., https://youtube.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  setUrl(pasted);
                  handleFetchMetadata(pasted);
                }}
                onBlur={() => {
                  if (url && !metadata && !loading) {
                    handleFetchMetadata();
                  }
                }}
                className="w-full pl-9 pr-24 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                required
              />
              <div className="absolute inset-y-0 right-1.5 flex items-center">
                <button
                  type="button"
                  onClick={() => handleFetchMetadata()}
                  disabled={loading || !url.trim()}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Fetching</span>
                    </>
                  ) : (
                    <span>Fetch</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              {error}
            </div>
          )}

          {/* Live Preview Card */}
          {(metadata || title) && (
            <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 flex gap-3 animate-in fade-in duration-200">
              {metadata?.thumbnailUrl && (
                <img
                  src={metadata.thumbnailUrl}
                  alt=""
                  className="w-20 h-14 object-cover rounded-lg shrink-0 border border-zinc-800"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-0.5">
                  <span className="capitalize">{metadata?.type || "link"}</span>
                  <span>•</span>
                  <span>{metadata?.domain || (url ? new URL(url).hostname : "")}</span>
                </div>
                <h4 className="text-xs font-medium text-zinc-200 truncate">
                  {title || metadata?.title || "Untitled"}
                </h4>
                {description && (
                  <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{description}</p>
                )}
              </div>
            </div>
          )}

          {/* Editable Details if needed */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-medium text-zinc-300 mb-1 block">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Tags Input */}
            <div>
              <label className="text-xs font-medium text-zinc-300 mb-1 block">
                Tags <span className="text-zinc-500 font-normal">(press Enter to add)</span>
              </label>
              <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 min-h-[38px]">
                {tags.map((t) => (
                  <TagBadge key={t} name={t} onRemove={() => removeTag(t)} />
                ))}
                <input
                  type="text"
                  placeholder={tags.length === 0 ? "e.g. react, design, ai" : "add tag..."}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none flex-1 min-w-[100px]"
                />
              </div>
            </div>

            {/* Personal Note */}
            <div>
              <label className="text-xs font-medium text-zinc-300 mb-1 block">
                Personal Note <span className="text-zinc-500 font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why are you saving this? Key takeaway to remember..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Status Selector */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Status:</span>
                <StatusBadge status={status} onStatusChange={setStatus} />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Favorite</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
              <kbd>⌘</kbd> + <kbd>Enter</kbd> to save
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !url.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save to Inbox</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

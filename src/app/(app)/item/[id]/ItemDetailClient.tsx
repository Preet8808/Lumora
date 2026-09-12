"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ItemWithDetails } from "@/lib/services/items.service";
import { StatusBadge, ItemStatus } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TagBadge } from "@/components/ui/TagBadge";
import {
  ArrowLeft,
  Star,
  ExternalLink,
  Check,
  Archive,
  Trash2,
  FileText,
  Clock,
  Calendar,
  Tag as TagIcon,
  Folder,
  Loader2,
  Save,
  Plus,
} from "lucide-react";
import { formatTimeAgo, formatDuration } from "@/lib/utils";

interface ItemDetailClientProps {
  initialItem: ItemWithDetails;
  availableTags: Array<{ id: string; name: string; color: string | null }>;
  availableCollections: Array<{ id: string; name: string; color: string | null }>;
}

export function ItemDetailClient({
  initialItem,
  availableTags,
  availableCollections,
}: ItemDetailClientProps) {
  const router = useRouter();
  const [item, setItem] = useState<ItemWithDetails>(initialItem);

  // Editable fields
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || "");
  const [noteContent, setNoteContent] = useState(item.notes?.[0]?.content || "");
  const [tagInput, setTagInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSavedNotice, setNoteSavedNotice] = useState(false);

  const handleStatusChange = async (newStatus: ItemStatus) => {
    setItem((prev) => ({ ...prev, status: newStatus }));
    try {
      await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleFavoriteToggle = async () => {
    const nextFav = !item.isFavorite;
    setItem((prev) => ({ ...prev, isFavorite: nextFav }));
    try {
      await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: nextFav }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleProgressChange = async (newProgress: number) => {
    setItem((prev) => ({ ...prev, progress: newProgress }));
    try {
      await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: newProgress }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveDetails = async () => {
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        const data = await res.json();
        setItem(data.item);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const res = await fetch(`/api/items/${item.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent }),
      });
      if (res.ok) {
        setNoteSavedNotice(true);
        setTimeout(() => setNoteSavedNotice(false), 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNote(false);
    }
  };

  const handleAddTag = async (tagIdOrName: string) => {
    // If it's an existing tag ID
    const existing = availableTags.find((t) => t.id === tagIdOrName || t.name === tagIdOrName);
    const tagIds = item.tags.map((t) => t.id);

    if (existing && !tagIds.includes(existing.id)) {
      tagIds.push(existing.id);
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds }),
      });
      if (res.ok) {
        const data = await res.json();
        setItem(data.item);
      }
    } else if (!existing && tagIdOrName.trim()) {
      // Create new tag first
      const newTagRes = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tagIdOrName.trim() }),
      });
      if (newTagRes.ok) {
        const tagData = await newTagRes.json();
        tagIds.push(tagData.tag.id);
        const res = await fetch(`/api/items/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagIds }),
        });
        if (res.ok) {
          const data = await res.json();
          setItem(data.item);
        }
      }
    }
    setTagInput("");
  };

  const handleRemoveTag = async (tagId: string) => {
    const tagIds = item.tags.filter((t) => t.id !== tagId).map((t) => t.id);
    const res = await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagIds }),
    });
    if (res.ok) {
      const data = await res.json();
      setItem(data.item);
    }
  };

  const handleToggleCollection = async (collectionId: string) => {
    let colIds = item.collections.map((c) => c.id);
    if (colIds.includes(collectionId)) {
      colIds = colIds.filter((id) => id !== collectionId);
    } else {
      colIds.push(collectionId);
    }

    const res = await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionIds: colIds }),
    });
    if (res.ok) {
      const data = await res.json();
      setItem(data.item);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this item?")) return;
    try {
      await fetch(`/api/items/${item.id}`, { method: "DELETE" });
      router.push("/inbox");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const formattedDuration = formatDuration(item.duration, item.type);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to items</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Favorite Star */}
          <button
            type="button"
            onClick={handleFavoriteToggle}
            className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title={item.isFavorite ? "Remove favorite" : "Mark as favorite"}
          >
            <Star className={`w-4 h-4 ${item.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
          </button>

          {/* Mark Finished */}
          <button
            type="button"
            onClick={() => handleStatusChange("FINISHED")}
            className="px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-purple-400" />
            <span>Mark Finished</span>
          </button>

          {/* Archive */}
          <button
            type="button"
            onClick={() => handleStatusChange("ARCHIVED")}
            className="px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5 text-zinc-400" />
            <span>Archive</span>
          </button>

          {/* Open Original */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span>Open Original</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Grid: Left content, Right metadata panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Media & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thumbnail / Hero */}
          {item.thumbnailUrl && (
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/40 shadow-xl">
              <img
                src={item.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Editable Title */}
          <div className="space-y-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveDetails}
              className="w-full text-xl md:text-2xl font-bold text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 focus:outline-none transition-colors py-1"
            />

            {/* Editable Description */}
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveDetails}
              placeholder="Add description..."
              className="w-full text-xs text-zinc-400 bg-transparent border border-transparent hover:border-zinc-800 focus:border-indigo-500 rounded-xl p-2 focus:outline-none transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Reading/Watching Progress Section */}
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300">Consumption Progress</span>
              <span className="text-zinc-500 font-mono">Drag slider to update</span>
            </div>
            <ProgressBar
              progress={item.progress}
              onProgressChange={handleProgressChange}
              interactive={true}
              size="md"
            />
          </div>

          {/* Personal Notes Section */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-zinc-200">Personal Notes</h3>
              </div>
              <div className="flex items-center gap-2">
                {noteSavedNotice && (
                  <span className="text-xs text-emerald-400 font-medium">Saved!</span>
                )}
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {savingNote ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  <span>Save Note</span>
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your key takeaways, timestamp notes, or code snippets here... (Searchable in ⌘K)"
              className="w-full p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed"
            />
          </div>
        </div>

        {/* Right Column: Metadata Sidebar */}
        <div className="space-y-6">
          {/* Status & Attributes Card */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Attributes
            </h4>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Status</span>
              <StatusBadge status={item.status} onStatusChange={handleStatusChange} />
            </div>

            {/* Content Type */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Type</span>
              <span className="capitalize font-medium text-zinc-200">{item.type}</span>
            </div>

            {/* Estimated Duration */}
            {formattedDuration && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Duration</span>
                </span>
                <span className="font-medium text-zinc-200">{formattedDuration}</span>
              </div>
            )}

            {/* Saved Date */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Saved</span>
              </span>
              <span className="text-zinc-400">{formatTimeAgo(item.savedAt)}</span>
            </div>

            {/* Domain */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Domain</span>
              <span className="font-mono text-zinc-300">{item.domain}</span>
            </div>
          </div>

          {/* Tags Manager Card */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <TagIcon className="w-3.5 h-3.5" />
                <span>Tags</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <TagBadge
                  key={tag.id}
                  name={tag.name}
                  color={tag.color}
                  onRemove={() => handleRemoveTag(tag.id)}
                />
              ))}
            </div>

            {/* Add Tag Input */}
            <div className="pt-2">
              <input
                type="text"
                placeholder="Type tag & hit Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagInput.trim()) {
                    e.preventDefault();
                    handleAddTag(tagInput.trim());
                  }
                }}
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Collections Card */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5" />
              <span>Collections</span>
            </span>

            <div className="space-y-1.5">
              {availableCollections.map((col) => {
                const isAssigned = item.collections.some((c) => c.id === col.id);
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => handleToggleCollection(col.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                      isAssigned
                        ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30"
                        : "bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                    }`}
                  >
                    <span>{col.name}</span>
                    {isAssigned && <Check className="w-3 h-3 text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Danger Zone: Delete Item */}
          <div className="pt-4">
            <button
              type="button"
              onClick={handleDelete}
              className="w-full py-2 rounded-xl border border-red-500/20 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Saved Item</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

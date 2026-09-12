"use client";

import React, { useState } from "react";
import { TagWithCount } from "@/lib/services/tags.service";
import { Tag as TagIcon, Plus, Edit2, Trash2, Check, X, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRouter } from "next/navigation";

interface TagsClientProps {
  initialTags: TagWithCount[];
}

export function TagsClient({ initialTags }: TagsClientProps) {
  const router = useRouter();
  const [tags, setTags] = useState<TagWithCount[]>(initialTags);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setTags([...tags, { ...data.tag, itemCount: 0 }]);
        setNewTagName("");
        setIsCreating(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });

      if (res.ok) {
        setTags(tags.map((t) => (t.id === id ? { ...t, name: editingName.trim() } : t)));
        setEditingId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    try {
      await fetch(`/api/tags/${id}`, { method: "DELETE" });
      setTags(tags.filter((t) => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <TagIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Tags</h1>
            <p className="text-xs text-zinc-400">Labels to cross-reference items across categories</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Tag</span>
        </button>
      </div>

      {/* Filter and Create form */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {isCreating && (
          <form onSubmit={handleCreate} className="flex items-center gap-2 animate-in fade-in">
            <input
              type="text"
              autoFocus
              placeholder="Tag name (e.g. redis)"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="p-1.5 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Tags Grid */}
      {filteredTags.length === 0 ? (
        <EmptyState
          icon={TagIcon}
          title="No tags found"
          description="Create custom tags to label and quickly filter your saved content."
          actionLabel="Create Tag"
          onAction={() => setIsCreating(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredTags.map((tag) => {
            const isEditing = editingId === tag.id;

            return (
              <div
                key={tag.id}
                className="group p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color || "#6366f1" }}
                  />
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-xs text-white"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleRename(tag.id)}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1 text-zinc-400 hover:text-zinc-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span
                      onClick={() => router.push(`/inbox?tagId=${tag.id}`)}
                      className="text-xs font-semibold text-zinc-200 truncate cursor-pointer hover:text-indigo-400"
                    >
                      #{tag.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-zinc-500">
                    {tag.itemCount} items
                  </span>

                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(tag.id);
                          setEditingName(tag.name);
                        }}
                        className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tag.id)}
                        className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

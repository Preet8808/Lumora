"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CollectionWithCount } from "@/lib/services/collections.service";
import { Folder, Plus, ArrowRight, BookOpen, Layers, Server, Cpu, Compass, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

interface CollectionsClientProps {
  initialCollections: CollectionWithCount[];
}

export function CollectionsClient({ initialCollections }: CollectionsClientProps) {
  const [collections, setCollections] = useState<CollectionWithCount[]>(initialCollections);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);

  const getIcon = (iconName: string | null) => {
    switch (iconName) {
      case "server":
        return <Server className="w-5 h-5" />;
      case "code":
        return <BookOpen className="w-5 h-5" />;
      case "layers":
        return <Layers className="w-5 h-5" />;
      case "cpu":
        return <Cpu className="w-5 h-5" />;
      case "compass":
        return <Compass className="w-5 h-5" />;
      default:
        return <Folder className="w-5 h-5" />;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), color }),
      });

      if (res.ok) {
        const data = await res.json();
        setCollections([...collections, { ...data.collection, itemCount: 0 }]);
        setName("");
        setDescription("");
        setIsCreating(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this collection?")) return;

    try {
      await fetch(`/api/collections/${id}`, { method: "DELETE" });
      setCollections(collections.filter((c) => c.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Collections</h1>
            <p className="text-xs text-zinc-400">Curate and group your knowledge by topic</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Collection</span>
        </button>
      </div>

      {/* New Collection Form */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4 max-w-lg animate-in fade-in zoom-in-95 duration-150"
        >
          <h3 className="text-sm font-semibold text-zinc-100">Create Collection</h3>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Systems, Design Systems"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Description (optional)</label>
            <input
              type="text"
              placeholder="Brief summary of what this collection contains"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
            >
              {saving ? "Creating..." : "Create Collection"}
            </button>
          </div>
        </form>
      )}

      {/* Collection Cards Grid */}
      {collections.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No collections yet"
          description="Group your saved items into dedicated themes and learning tracks."
          actionLabel="Create Collection"
          onAction={() => setIsCreating(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.id}`}
              className="group p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: `${col.color || "#6366f1"}20`, color: col.color || "#6366f1" }}
                  >
                    {getIcon(col.icon)}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(col.id, e)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Delete collection"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-base font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors">
                  {col.name}
                </h3>
                {col.description && (
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {col.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
                <span className="font-mono font-medium">{col.itemCount} items</span>
                <span className="flex items-center gap-1 text-zinc-400 group-hover:text-indigo-400 transition-colors">
                  <span>Explore</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

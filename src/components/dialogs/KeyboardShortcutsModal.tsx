"use client";

import React from "react";
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "⌘K / Ctrl+K", description: "Open global search palette" },
    { key: "N", description: "Quick Save a new URL" },
    { key: "I", description: "Go to Inbox" },
    { key: "F", description: "Go to Favorites" },
    { key: "C", description: "Go to Collections" },
    { key: "A", description: "Go to Archive" },
    { key: "?", description: "Open this keyboard shortcuts modal" },
    { key: "Esc", description: "Close any active modal or palette" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl z-10 animate-in zoom-in-95 fade-in duration-150">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Keyboard Shortcuts</h3>
              <p className="text-xs text-zinc-400">Navigate Lumora with your keyboard</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 divide-y divide-zinc-800/50">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-300">{s.description}</span>
              <kbd>{s.key}</kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center">
          <p className="text-xs text-zinc-500">
            Tip: Press <kbd>?</kbd> at any time to view these shortcuts.
          </p>
        </div>
      </div>
    </div>
  );
}

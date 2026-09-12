"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { QuickSaveModal } from "@/components/dialogs/QuickSaveModal";
import { SearchCommandModal } from "@/components/dialogs/SearchCommandModal";
import { KeyboardShortcutsModal } from "@/components/dialogs/KeyboardShortcutsModal";

interface AppShellProps {
  children: React.ReactNode;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  initialStats?: {
    inbox: number;
    continue: number;
    favorites: number;
    collections: number;
    tags: number;
    archive: number;
  };
}

export function AppShell({ children, user, initialStats }: AppShellProps) {
  const router = useRouter();
  const [stats, setStats] = useState(initialStats);
  const [isQuickSaveOpen, setIsQuickSaveOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputFocused =
        activeTag === "input" || activeTag === "textarea" || (document.activeElement as HTMLElement)?.isContentEditable;

      // ⌘K or Ctrl+K always triggers Search Command
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }

      // Ignore single character shortcuts if user is typing in an input
      if (isInputFocused) return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setIsQuickSaveOpen(true);
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        router.push("/inbox");
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        router.push("/favorites");
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        router.push("/collections");
      } else if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        router.push("/archive");
      } else if (e.key === "?") {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const refreshStats = async () => {
    try {
      const res = await fetch("/api/items?limit=1");
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
      }
    } catch {}
  };

  const handleItemSaved = () => {
    refreshStats();
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Desktop Sidebar */}
      <AppSidebar
        stats={stats}
        onOpenQuickSave={() => setIsQuickSaveOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          userName={user.name}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenQuickSave={() => setIsQuickSaveOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Modals */}
      <QuickSaveModal
        isOpen={isQuickSaveOpen}
        onClose={() => setIsQuickSaveOpen(false)}
        onItemSaved={handleItemSaved}
      />

      <SearchCommandModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

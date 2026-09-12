"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Menu,
  LogOut,
  User,
  Database,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface AppHeaderProps {
  userName?: string | null;
  onOpenSearch: () => void;
  onOpenQuickSave: () => void;
  onToggleMobileMenu?: () => void;
}

export function AppHeader({
  userName,
  onOpenSearch,
  onOpenQuickSave,
  onToggleMobileMenu,
}: AppHeaderProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await fetch("/api/seed", { method: "POST" });
      router.refresh();
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="h-16 border-b border-zinc-800/80 px-4 md:px-8 flex items-center justify-between sticky top-0 bg-zinc-950/70 backdrop-blur-md z-30">
      {/* Left side: Mobile menu & Greeting */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <h2 className="text-sm md:text-base font-semibold text-zinc-100 flex items-center gap-1.5">
            <span>{getGreeting()}, {userName?.split(" ")[0] || "Friend"}</span>
            <span className="inline-block animate-wave">👋</span>
          </h2>
          <p className="text-[11px] text-zinc-500 hidden sm:block">
            Your personal second-brain inbox for the internet
          </p>
        </div>
      </div>

      {/* Right side: Search trigger, Quick save & Profile */}
      <div className="flex items-center gap-2.5">
        {/* Search Bar Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer shadow-sm group"
        >
          <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          <span className="hidden sm:inline">Search library...</span>
          <div className="flex items-center gap-1 ml-1 text-zinc-500">
            <kbd className="text-[10px] py-0 px-1">⌘K</kbd>
          </div>
        </button>

        {/* Quick Save button */}
        <button
          type="button"
          onClick={onOpenQuickSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Save something</span>
        </button>

        <ThemeToggle />

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-xs font-medium text-zinc-300 hover:border-zinc-500 transition-colors cursor-pointer"
          >
            {userName ? userName.charAt(0).toUpperCase() : <User className="w-4 h-4 text-zinc-400" />}
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl shadow-2xl p-1.5 z-50 divide-y divide-zinc-800/60">
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{userName || "User"}</p>
                  <p className="text-[10px] text-zinc-500">Active Workspace</p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleSeedDemo}
                    disabled={seeding}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{seeding ? "Populating..." : "Reset Demo Data"}</span>
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  Play,
  Star,
  Folder,
  Tag as TagIcon,
  Archive,
  Compass,
  Plus,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  stats?: {
    inbox: number;
    continue: number;
    favorites: number;
    collections: number;
    tags: number;
    archive: number;
  };
  onOpenQuickSave: () => void;
  onOpenShortcuts: () => void;
}

export function AppSidebar({
  stats,
  onOpenQuickSave,
  onOpenShortcuts,
}: AppSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Compass,
      count: undefined,
    },
    {
      label: "Inbox",
      href: "/inbox",
      icon: Inbox,
      count: stats?.inbox,
      color: "text-blue-400",
    },
    {
      label: "Continue",
      href: "/continue",
      icon: Play,
      count: stats?.continue,
      color: "text-emerald-400",
    },
    {
      label: "Favorites",
      href: "/favorites",
      icon: Star,
      count: stats?.favorites,
      color: "text-amber-400",
    },
    {
      label: "Collections",
      href: "/collections",
      icon: Folder,
      count: stats?.collections,
      color: "text-indigo-400",
    },
    {
      label: "Tags",
      href: "/tags",
      icon: TagIcon,
      count: stats?.tags,
      color: "text-purple-400",
    },
    {
      label: "Archive",
      href: "/archive",
      icon: Archive,
      count: stats?.archive,
      color: "text-zinc-500",
    },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800/80 bg-zinc-950/60 flex flex-col justify-between h-screen shrink-0 sticky top-0 backdrop-blur-md select-none hidden md:flex">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 flex items-center justify-between border-b border-zinc-800/60">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              L
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-zinc-100">Lumora</span>
              <span className="text-[10px] text-zinc-500 block leading-tight">Save it for Later</span>
            </div>
          </Link>
        </div>

        {/* Primary Action Button */}
        <div className="p-3">
          <button
            type="button"
            onClick={onOpenQuickSave}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Save something</span>
            <kbd className="ml-auto bg-indigo-700/50 text-indigo-200 border-indigo-400/30 text-[10px] py-0 px-1.5">
              N
            </kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1 mt-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                  isActive
                    ? "bg-zinc-800/90 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-indigo-400" : item.color || "text-zinc-400 group-hover:text-zinc-200"
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded-full",
                      isActive
                        ? "bg-zinc-700 text-zinc-200"
                        : "bg-zinc-900 text-zinc-500 group-hover:text-zinc-400"
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Shortcuts */}
      <div className="p-3 border-t border-zinc-800/60">
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Shortcuts</span>
          </div>
          <kbd>?</kbd>
        </button>
      </div>
    </aside>
  );
}

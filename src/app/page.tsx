import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Inbox,
  Search,
  CheckCircle2,
  Play,
  Star,
  ExternalLink,
} from "lucide-react";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Nav */}
      <header className="px-6 py-5 max-w-6xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold text-base shadow-md shadow-indigo-600/30">
            L
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-zinc-100">Lumora</span>
            <span className="text-[11px] text-zinc-500 block">Save it for Later</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span>Open Lumora</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>A personal second-brain inbox for the internet</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-100 mb-6 leading-tight">
          Save anything. Organize automatically. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
            Find it when you need it.
          </span>
        </h1>

        <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          Stop losing useful YouTube videos, GitHub repos, technical articles, and Reddit discussions across infinite tabs. Lumora extracts rich metadata and gives them a home you&apos;ll actually return to.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-3 rounded-2xl text-sm font-medium bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <span>Read Architecture</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
          </a>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <Inbox className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-1">Instant Quick Save</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Paste any URL. Auto-extracts titles, thumbnails, reading durations, stars, and tags with zero friction.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Play className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-1">Progress Tracking</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Track watching and reading completion with visual scrubber bars so you can pick up exactly where you left off.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
              <Search className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-1">Global ⌘K Search</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Full-text search across titles, descriptions, notes, tags, domains, and collections with instant keyboard navigation.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-zinc-900 text-center text-xs text-zinc-500">
        <p>Lumora — The modern second-brain inbox for the internet.</p>
      </footer>
    </div>
  );
}

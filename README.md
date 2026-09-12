# Lumora — Save It For Later

> **A personal second-brain inbox for the internet.**  
> *Save anything. Organize automatically. Find it when you need it.*

![Lumora Banner](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80)

Lumora solves the universal problem of digital hoarding and tab overload. When discovering valuable YouTube deep-dives, GitHub repositories, system design articles, Reddit engineering threads, or documentation, users constantly lose them in browser tabs, bookmarks, or disconnected note apps.

Lumora allows you to save any URL from the internet in seconds, automatically extracts rich domain-specific metadata (thumbnails, channels, reading durations, repository stars), organizes items with minimal effort, tracks your reading/watching progress, and surfaces content when you actually have time to consume it.

---

## 🌟 Key Features

### ⚡ 1. Lightning Quick Save
- **Automatic Metadata Extraction**: Paste any link. Lumora detects the target domain and extracts:
  - **YouTube**: Video title, channel, high-res thumbnail, duration estimation.
  - **GitHub**: Repository name, owner, description, language, stars count.
  - **Reddit**: Discussion title, subreddit, author, preview thumbnail.
  - **Articles & Websites**: OpenGraph tags, Twitter cards, meta descriptions, author, and favicons.
- **SSRF Shield**: Safe URL validation blocking loopback, link-local, and private IP ranges (127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, cloud metadata).
- **Graceful Fallbacks**: If scraping is restricted, instant manual entry fields ensure you are never blocked.

### 📥 2. Processing Inbox & Status Lifecycle
- **Inbox-First Philosophy**: Every newly saved link starts in `Inbox`.
- **Status Lifecycle**: `INBOX` ➔ `WANT_TO_READ` ➔ `IN_PROGRESS` ➔ `FINISHED` ➔ `ARCHIVED`.
- **Favorites**: Independent starring system.
- **1-Click Card Actions**: Change status, scrub progress, or star items directly from card view without opening the item.
- **Bulk Processing**: Multi-select cards to bulk-archive, bulk-tag, bulk-update status, or delete.

### 🎯 3. Workspace Dashboard
- **Continue Consuming**: Shows items you have started (e.g. YouTube video 68% watched) with an interactive progress slider and direct "Continue" launcher.
- **Recently Saved**: Displays newest arrivals in your inbox.
- **Quick Wins**: Surfaces short content (under 15 minutes) for quick reading breaks.
- **Deterministic Recommendations**: Heuristic scoring engine based on recency, matching tags, and consumption progress.

### 🔍 4. Global ⌘K / Ctrl+K Command Palette
- Keyboard-first command palette searching across:
  - Titles
  - Descriptions
  - Domains
  - User Tags
  - Personal Notes
  - Collection names
- Filter chips for Content Types (Articles, YouTube, GitHub, Reddit) and Statuses.
- Keyboard navigation (<kbd>↑</kbd>, <kbd>↓</kbd>, <kbd>↵</kbd>, <kbd>esc</kbd>).

### 📝 5. Personal Notes & Progress Tracking
- **Searchable Notes**: Dedicated markdown notes on every saved item (e.g. key timestamp takeaways, code snippets).
- **Consumption Scrubber**: Visual and draggable progress bar tracking completion percentage.

### 📚 6. Collections & Tags
- Curate topics like *Backend Engineering*, *React Learning*, *System Design*, *AI Resources*.
- Items can belong to multiple collections and tags.

### ⌨️ 7. Keyboard Shortcuts Everywhere
- <kbd>⌘K</kbd> or <kbd>Ctrl+K</kbd> — Search library
- <kbd>N</kbd> — Quick Save URL
- <kbd>I</kbd> — Go to Inbox
- <kbd>F</kbd> — Go to Favorites
- <kbd>C</kbd> — Go to Collections
- <kbd>A</kbd> — Go to Archive
- <kbd>?</kbd> — Open keyboard shortcuts modal

### 🔒 8. Enterprise-Grade Multi-User Data Isolation
- Complete tenant data isolation at the database query level.
- Session-derived user identities. A user can never access or query another user's saved items, collections, notes, or tags.

### 🔌 9. Browser Extension Architecture Ready
- Dedicated endpoint `POST /api/v1/extension/save` supporting Bearer API tokens and browser session cookies for 1-click context menu saving.

---

## 🏗 System Architecture

```
                               ┌───────────────────────────┐
                               │  Browser / Mobile Client  │
                               └─────────────┬─────────────┘
                                             │ HTTP / HTTPS
                                             ▼
                             ┌───────────────────────────────┐
                             │ Next.js 16 App Router (React) │
                             │ • Server Components & Actions │
                             │ • Jose JWT Secure Cookies     │
                             └───────┬───────────────┬───────┘
                                     │               │
                     ┌───────────────┘               └────────────────┐
                     ▼                                                ▼
         ┌───────────────────────┐                        ┌───────────────────────┐
         │ Metadata Service      │                        │ Database Engine       │
         │ • SSRF Filter         │                        │ • Drizzle ORM         │
         │ • YouTube / GitHub /  │                        │ • Neon / Supabase PG  │
         │   Reddit / Cheerio    │                        │ • PGlite Local Engine │
         └───────────────────────┘                        └───────────────────────┘
                     │                                                ▲
                     ▼                                                │
         ┌───────────────────────┐                        ┌───────────┴───────────┐
         │ Future AI Service     │                        │ Recommendation Engine │
         │ • LLM Summaries       │                        │ • Recency Scoring     │
         │ • Auto-Tagging        │                        │ • Tag Affinity        │
         │ • Semantic Search     │                        │ • Quick-Win Heuristic │
         └───────────────────────┘                        └───────────────────────┘
```

---

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, `next-themes` (Dark & Light theme support).
- **Backend**: Next.js Server Actions & API Route Handlers, Zod schema validation.
- **Database & ORM**: PostgreSQL with Drizzle ORM.
  - **Zero-Config Local Development**: Embedded PGlite fallback in `.data/pglite` (requires zero local Postgres installation or credentials).
  - **Production**: Seamless connection to Neon, Supabase, AWS RDS, or self-hosted PostgreSQL via `DATABASE_URL`.
- **Authentication**: JWT session tokens signed with `jose` and stored in `httpOnly`, `sameSite: 'lax'` secure cookies with `bcryptjs` password hashing.
- **Metadata Extraction**: Cheerio HTML parser with domain-specific oEmbed/API handlers and SSRF IP blacklist filters.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v20 and v24)
- npm or pnpm

### 1. Clone & Install
```bash
git clone https://github.com/Preet8808/Lumora.git
cd Lumora
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Default settings in `.env.local`:
```env
AUTH_SECRET="lumora-development-secret-key-32-characters-minimum-for-local-runs"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Connect to any PostgreSQL instance (Neon / Supabase / Local):
# DATABASE_URL="postgresql://postgres:password@localhost:5432/lumora"
```
*(Note: If `DATABASE_URL` is omitted, Lumora automatically uses embedded PGlite in `.data/pglite/`, so you can run instantly without installing Postgres).*

### 3. Seed Realistic Demo Data
Populate realistic YouTube videos, GitHub repos, technical articles, tags, collections, and progress values:
```bash
npm run db:seed
```

Demo Accounts:
- **Primary Demo**: `demo@lumora.app` | Password: `password123` (Alex Chen)
- **Data Isolation Test**: `alice@lumora.app` | Password: `password123` (Alice Vance)

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

Run the automated end-to-end test suite:
```bash
node scripts/test-app.mjs
```
The test suite validates:
1. Landing page rendering
2. Authentication & JWT session cookie issuance
3. Dashboard heuristics (Continue, Quick Wins, Recommendations)
4. SSRF protection (loopback IP blocking)
5. Live metadata extraction (GitHub, YouTube)
6. Inbox creation & status lifecycle
7. Global ⌘K full-text search with match scoring
8. Progress scrubber updates
9. Browser extension API endpoint
10. Strict multi-user tenant data isolation

---

## 🚢 Deployment

### Deploying to Vercel + Neon / Supabase
1. Create a database on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy the connection string (e.g. `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`).
3. Deploy to Vercel:
   - Push repository to GitHub.
   - Import project into Vercel.
   - Configure Environment Variables:
     - `DATABASE_URL`: Your Neon/Supabase connection string.
     - `AUTH_SECRET`: A secure 32+ character random string.
     - `NEXT_PUBLIC_APP_URL`: Your Vercel deployment domain.
4. Run migrations/seed:
   ```bash
   npx drizzle-kit push
   npm run db:seed
   ```

---

## 🗺 Roadmap

- [x] MVP Core (Quick Save, Metadata Extractor, Inbox, Tags, Collections, Notes, Progress)
- [x] Global ⌘K Search with multi-field matching
- [x] Deterministic Recommendation Service
- [x] Browser Extension API (`/api/v1/extension/save`)
- [ ] Official Chrome & Firefox Extension companion
- [ ] AI Summary generation & automatic tag suggestions (via `AIService` boundary)
- [ ] pgvector semantic search & "Ask My Library" RAG questions
- [ ] Offline PWA caching & mobile share sheet target

---

## 📄 License
MIT License. Created with ❤️ for internet explorers and lifelong learners.

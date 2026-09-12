import { getDb } from "./index";
import {
  users,
  savedItems,
  tags,
  itemTags,
  collections,
  itemCollections,
  notes,
} from "./schema";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  const db = await getDb();

  // Create Demo User
  const demoEmail = "demo@lumora.app";
  let [demoUser] = await db.select().from(users).where(eq(users.email, demoEmail)).limit(1);

  if (!demoUser) {
    const passwordHash = await bcrypt.hash("password123", 10);
    const userId = randomUUID();
    await db.insert(users).values({
      id: userId,
      email: demoEmail,
      name: "Alex Chen",
      passwordHash,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    [demoUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  }

  // Create Alice User for isolation demo
  const aliceEmail = "alice@lumora.app";
  let [aliceUser] = await db.select().from(users).where(eq(users.email, aliceEmail)).limit(1);
  if (!aliceUser) {
    const passwordHash = await bcrypt.hash("password123", 10);
    const userId = randomUUID();
    await db.insert(users).values({
      id: userId,
      email: aliceEmail,
      name: "Alice Vance",
      passwordHash,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    [aliceUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  }

  const userId = demoUser.id;

  // Check if items already exist for demoUser
  const existingItems = await db.select().from(savedItems).where(eq(savedItems.userId, userId));
  if (existingItems.length > 0) {
    return { success: true, message: "Database already seeded for demo user", user: demoUser };
  }

  // 1. Create Tags
  const tagList = [
    { id: randomUUID(), name: "react", color: "#3b82f6" },
    { id: randomUUID(), name: "nextjs", color: "#10b981" },
    { id: randomUUID(), name: "backend", color: "#6366f1" },
    { id: randomUUID(), name: "redis", color: "#ef4444" },
    { id: randomUUID(), name: "databases", color: "#f59e0b" },
    { id: randomUUID(), name: "systems", color: "#8b5cf6" },
    { id: randomUUID(), name: "design", color: "#ec4899" },
    { id: randomUUID(), name: "career", color: "#06b6d4" },
    { id: randomUUID(), name: "ai", color: "#84cc16" },
  ];

  for (const t of tagList) {
    await db.insert(tags).values({
      id: t.id,
      userId,
      name: t.name,
      color: t.color,
      createdAt: new Date(),
    });
  }

  const getTagId = (name: string) => tagList.find((t) => t.name === name)?.id;

  // 2. Create Collections
  const colList = [
    {
      id: randomUUID(),
      name: "Backend Engineering",
      description: "Distributed systems, databases, caching & concurrency",
      color: "#6366f1",
      icon: "server",
    },
    {
      id: randomUUID(),
      name: "React Learning",
      description: "Component patterns, RSC, modern frontend state",
      color: "#3b82f6",
      icon: "code",
    },
    {
      id: randomUUID(),
      name: "System Design",
      description: "Architecture blueprints, consensus algorithms, scalability",
      color: "#f59e0b",
      icon: "layers",
    },
    {
      id: randomUUID(),
      name: "AI Resources",
      description: "LLMs, embeddings, RAG pipelines, agents",
      color: "#10b981",
      icon: "cpu",
    },
    {
      id: randomUUID(),
      name: "Career",
      description: "Engineering growth, interview prep, team leadership",
      color: "#ec4899",
      icon: "compass",
    },
  ];

  for (const c of colList) {
    await db.insert(collections).values({
      id: c.id,
      userId,
      name: c.name,
      description: c.description,
      color: c.color,
      icon: c.icon,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const getColId = (name: string) => colList.find((c) => c.name === name)?.id;

  // 3. Create Realistic Demo Items
  const itemsToCreate = [
    {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "Building a Redis Clone From Scratch in C",
      description: "Complete walkthrough of building an in-memory key-value database engine with event loops, RESP protocol, and LRU cache eviction.",
      domain: "youtube.com",
      type: "youtube",
      thumbnailUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80",
      faviconUrl: "https://www.google.com/s2/favicons?domain=youtube.com&sz=128",
      author: "CodeCraft Studios",
      duration: 42,
      status: "IN_PROGRESS",
      isFavorite: true,
      progress: 68,
      savedAt: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 days ago
      tagNames: ["backend", "redis", "systems", "databases"],
      colNames: ["Backend Engineering", "System Design"],
      note: "Important section around 18:30.\nThey explain cache eviction really well.\nTODO:\nTry implementing this with a double linked list.",
    },
    {
      url: "https://github.com/shadcn-ui/ui",
      title: "shadcn/ui — Accessible & Customizable Component Primitives",
      description: "Beautifully designed components that you can copy and paste into your apps. Accessible. Customizable. Open Source.",
      domain: "github.com",
      type: "github",
      thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
      faviconUrl: "https://www.google.com/s2/favicons?domain=github.com&sz=128",
      author: "shadcn",
      duration: 12,
      status: "WANT_TO_READ",
      isFavorite: true,
      progress: 0,
      savedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      tagNames: ["react", "design", "nextjs"],
      colNames: ["React Learning"],
      note: "Review the dialog and command menu implementations for keyboard trap management.",
    },
    {
      url: "https://vercel.com/blog/understanding-react-server-components",
      title: "Understanding React Server Components Architecture",
      description: "A comprehensive deep dive into React Server Components, streaming SSR, and how the payload boundaries work in modern Next.js.",
      domain: "vercel.com",
      type: "article",
      thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80",
      faviconUrl: "https://www.google.com/s2/favicons?domain=vercel.com&sz=128",
      author: "Guillermo Rauch",
      duration: 14,
      status: "INBOX",
      isFavorite: false,
      progress: 0,
      savedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      tagNames: ["react", "nextjs", "backend"],
      colNames: ["React Learning"],
      note: null,
    },
    {
      url: "https://www.reddit.com/r/PostgreSQL/comments/neon_scale_story",
      title: "How We Scaled Our Postgres Database to 50M Rows on Neon Serverless",
      description: "Production architectural lessons on connection pooling, prepared statements, and autoscaling compute endpoints.",
      domain: "reddit.com",
      type: "reddit",
      thumbnailUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80",
      faviconUrl: "https://www.google.com/s2/favicons?domain=reddit.com&sz=128",
      author: "u/db_ninja",
      duration: 8,
      status: "WANT_TO_READ",
      isFavorite: false,
      progress: 25,
      savedAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
      tagNames: ["databases", "backend"],
      colNames: ["Backend Engineering", "System Design"],
      note: "Check pooler configuration: transaction mode vs session mode.",
    },
    {
      url: "https://www.youtube.com/watch?v=vYp4LYbnnW8",
      title: "Distributed Systems: The Raft Consensus Algorithm Explained",
      description: "Visual explanation of leader election, log replication, and split-brain safety in consensus-based clusters.",
      domain: "youtube.com",
      type: "youtube",
      thumbnailUrl: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&auto=format&fit=crop&q=80",
      faviconUrl: "https://www.google.com/s2/favicons?domain=youtube.com&sz=128",
      author: "Secret Algorithm Society",
      duration: 28,
      status: "IN_PROGRESS",
      isFavorite: true,
      progress: 45,
      savedAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
      tagNames: ["systems", "backend"],
      colNames: ["System Design", "Backend Engineering"],
      note: "Leader heartbeat timeout vs election timeout mechanics are crucial.",
    },
    {
      url: "https://authjs.dev/getting-started",
      title: "Auth.js Documentation — Next-Generation Authentication",
      description: "Universal authentication for modern web applications. Supports OAuth 2.0, WebAuthn, JWT, and session persistence.",
      domain: "authjs.dev",
      type: "article",
      thumbnailUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80",
      faviconUrl: "https://www.google.com/s2/favicons?domain=authjs.dev&sz=128",
      author: "Auth.js Core Team",
      duration: 15,
      status: "FINISHED",
      isFavorite: true,
      progress: 100,
      savedAt: new Date(Date.now() - 1000 * 60 * 60 * 120),
      tagNames: ["nextjs", "backend"],
      colNames: ["React Learning"],
      note: "Reference for setting up edge-compatible JWT session cookie signing.",
    },
    {
      url: "https://uxdesign.cc/designing-micro-interactions-that-delight-users",
      title: "Designing Micro-Interactions That Delight Users",
      description: "Principles of subtle motion design, haptics, and responsive feedback loops in modern digital interfaces.",
      domain: "uxdesign.cc",
      type: "article",
      thumbnailUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80",
      faviconUrl: "https://www.google.com/s2/favicons?domain=medium.com&sz=128",
      author: "Sarah Jenkins",
      duration: 7,
      status: "INBOX",
      isFavorite: false,
      progress: 0,
      savedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      tagNames: ["design", "career"],
      colNames: ["Career"],
      note: null,
    },
    {
      url: "https://github.com/vercel/next.js",
      title: "vercel/next.js — The React Framework for the Web",
      description: "Used by some of the world's largest companies, Next.js enables you to create full-stack Web applications by extending the latest React features.",
      domain: "github.com",
      type: "github",
      thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
      faviconUrl: "https://www.google.com/s2/favicons?domain=github.com&sz=128",
      author: "vercel",
      duration: 15,
      status: "WANT_TO_READ",
      isFavorite: false,
      progress: 0,
      savedAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
      tagNames: ["nextjs", "react"],
      colNames: ["React Learning"],
      note: null,
    },
  ];

  for (const itemData of itemsToCreate) {
    const itemId = randomUUID();
    await db.insert(savedItems).values({
      id: itemId,
      userId,
      url: itemData.url,
      title: itemData.title,
      description: itemData.description,
      domain: itemData.domain,
      type: itemData.type,
      thumbnailUrl: itemData.thumbnailUrl,
      faviconUrl: itemData.faviconUrl,
      author: itemData.author,
      duration: itemData.duration,
      status: itemData.status,
      isFavorite: itemData.isFavorite,
      progress: itemData.progress,
      savedAt: itemData.savedAt,
      updatedAt: itemData.savedAt,
    });

    // Link Tags
    for (const tagName of itemData.tagNames) {
      const tagId = getTagId(tagName);
      if (tagId) {
        await db.insert(itemTags).values({ itemId, tagId }).onConflictDoNothing();
      }
    }

    // Link Collections
    for (const colName of itemData.colNames) {
      const colId = getColId(colName);
      if (colId) {
        await db.insert(itemCollections).values({ itemId, collectionId: colId }).onConflictDoNothing();
      }
    }

    // Add Note if present
    if (itemData.note) {
      await db.insert(notes).values({
        id: randomUUID(),
        itemId,
        content: itemData.note,
        createdAt: itemData.savedAt,
        updatedAt: itemData.savedAt,
      });
    }
  }

  // Alice gets isolated items to prove data isolation!
  const aliceItemId = randomUUID();
  await db.insert(savedItems).values({
    id: aliceItemId,
    userId: aliceUser.id,
    url: "https://github.com/alice/private-research",
    title: "Alice's Secret Research Project",
    description: "Confidential quantum computing notes. Only visible to Alice.",
    domain: "github.com",
    type: "github",
    status: "INBOX",
    isFavorite: true,
    progress: 0,
    savedAt: new Date(),
    updatedAt: new Date(),
  });

  return { success: true, message: "Database seeded successfully!", user: demoUser };
}

import * as schema from "./schema";

// Universal database client supporting both standard PostgreSQL (via postgres-js)
// and embedded PGlite (for zero-config local running)
let dbInstance: any = null;

export async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.trim() !== "") {
    try {
      const postgres = (await import("postgres")).default;
      const { drizzle } = await import("drizzle-orm/postgres-js");
      const client = postgres(databaseUrl, { max: 10 });
      dbInstance = drizzle(client, { schema });
      return dbInstance;
    } catch (err) {
      console.warn("Failed to connect via DATABASE_URL, falling back to embedded PGlite:", err);
    }
  }

  // Embedded PostgreSQL fallback via PGlite
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const path = await import("path");
  const fs = await import("fs");

  const dataDir = path.join(process.cwd(), ".data", "pglite");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const client = new PGlite(dataDir);
  dbInstance = drizzle(client, { schema });

  // Ensure tables exist in PGlite
  await initTables(client);

  return dbInstance;
}

// Synchronous / cached proxy to ease imports in server components/actions
export const db = new Proxy({} as any, {
  get(_target, prop) {
    return async (...args: any[]) => {
      const activeDb = await getDb();
      const targetProp = activeDb[prop];
      if (typeof targetProp === "function") {
        return targetProp.apply(activeDb, args);
      }
      return targetProp;
    };
  },
});

async function initTables(client: any) {
  try {
    await client.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        image TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS saved_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        domain TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'website',
        thumbnail_url TEXT,
        favicon_url TEXT,
        author TEXT,
        duration INTEGER,
        status TEXT NOT NULL DEFAULT 'INBOX',
        is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
        progress INTEGER NOT NULL DEFAULT 0,
        saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS saved_items_user_idx ON saved_items(user_id);
      CREATE INDEX IF NOT EXISTS saved_items_status_idx ON saved_items(status);
      CREATE INDEX IF NOT EXISTS saved_items_saved_at_idx ON saved_items(saved_at);
      CREATE INDEX IF NOT EXISTS saved_items_domain_idx ON saved_items(domain);
      CREATE INDEX IF NOT EXISTS saved_items_type_idx ON saved_items(type);
      CREATE INDEX IF NOT EXISTS saved_items_user_status_idx ON saved_items(user_id, status);

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#6366f1',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS tags_user_idx ON tags(user_id);
      CREATE INDEX IF NOT EXISTS tags_user_name_idx ON tags(user_id, name);

      CREATE TABLE IF NOT EXISTS item_tags (
        item_id TEXT NOT NULL REFERENCES saved_items(id) ON DELETE CASCADE,
        tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (item_id, tag_id)
      );

      CREATE INDEX IF NOT EXISTS item_tags_item_idx ON item_tags(item_id);
      CREATE INDEX IF NOT EXISTS item_tags_tag_idx ON item_tags(tag_id);

      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3b82f6',
        icon TEXT DEFAULT 'folder',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS collections_user_idx ON collections(user_id);

      CREATE TABLE IF NOT EXISTS item_collections (
        item_id TEXT NOT NULL REFERENCES saved_items(id) ON DELETE CASCADE,
        collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        PRIMARY KEY (item_id, collection_id)
      );

      CREATE INDEX IF NOT EXISTS item_collections_item_idx ON item_collections(item_id);
      CREATE INDEX IF NOT EXISTS item_collections_collection_idx ON item_collections(collection_id);

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL REFERENCES saved_items(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS notes_item_idx ON notes(item_id);

      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        key_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS api_keys_user_idx ON api_keys(user_id);
    `);
  } catch (e) {
    console.error("Error creating tables in PGlite:", e);
  }
}

import { pgTable, text, timestamp, boolean, integer, primaryKey, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const savedItems = pgTable(
  "saved_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    domain: text("domain").notNull(),
    type: text("type").notNull().default("website"), // 'youtube' | 'github' | 'reddit' | 'article' | 'website'
    thumbnailUrl: text("thumbnail_url"),
    faviconUrl: text("favicon_url"),
    author: text("author"),
    duration: integer("duration"), // in minutes
    status: text("status").notNull().default("INBOX"), // 'INBOX' | 'WANT_TO_READ' | 'IN_PROGRESS' | 'FINISHED' | 'ARCHIVED'
    isFavorite: boolean("is_favorite").notNull().default(false),
    progress: integer("progress").notNull().default(0), // 0 to 100
    savedAt: timestamp("saved_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("saved_items_user_idx").on(table.userId),
    index("saved_items_status_idx").on(table.status),
    index("saved_items_saved_at_idx").on(table.savedAt),
    index("saved_items_domain_idx").on(table.domain),
    index("saved_items_type_idx").on(table.type),
    index("saved_items_user_status_idx").on(table.userId, table.status),
  ]
);

export const tags = pgTable(
  "tags",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").default("#6366f1"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("tags_user_idx").on(table.userId),
    index("tags_user_name_idx").on(table.userId, table.name),
  ]
);

export const itemTags = pgTable(
  "item_tags",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => savedItems.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.itemId, table.tagId] }),
    index("item_tags_item_idx").on(table.itemId),
    index("item_tags_tag_idx").on(table.tagId),
  ]
);

export const collections = pgTable(
  "collections",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").default("#3b82f6"),
    icon: text("icon").default("folder"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("collections_user_idx").on(table.userId),
  ]
);

export const itemCollections = pgTable(
  "item_collections",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => savedItems.id, { onDelete: "cascade" }),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.itemId, table.collectionId] }),
    index("item_collections_item_idx").on(table.itemId),
    index("item_collections_collection_idx").on(table.collectionId),
  ]
);

export const notes = pgTable(
  "notes",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id")
      .notNull()
      .references(() => savedItems.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notes_item_idx").on(table.itemId),
  ]
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    keyHash: text("key_hash").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("api_keys_user_idx").on(table.userId),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  savedItems: many(savedItems),
  tags: many(tags),
  collections: many(collections),
  apiKeys: many(apiKeys),
}));

export const savedItemsRelations = relations(savedItems, ({ one, many }) => ({
  user: one(users, {
    fields: [savedItems.userId],
    references: [users.id],
  }),
  itemTags: many(itemTags),
  itemCollections: many(itemCollections),
  notes: many(notes),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  itemTags: many(itemTags),
}));

export const itemTagsRelations = relations(itemTags, ({ one }) => ({
  item: one(savedItems, {
    fields: [itemTags.itemId],
    references: [savedItems.id],
  }),
  tag: one(tags, {
    fields: [itemTags.tagId],
    references: [tags.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  itemCollections: many(itemCollections),
}));

export const itemCollectionsRelations = relations(itemCollections, ({ one }) => ({
  item: one(savedItems, {
    fields: [itemCollections.itemId],
    references: [savedItems.id],
  }),
  collection: one(collections, {
    fields: [itemCollections.collectionId],
    references: [collections.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  item: one(savedItems, {
    fields: [notes.itemId],
    references: [savedItems.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SavedItem = typeof savedItems.$inferSelect;
export type NewSavedItem = typeof savedItems.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;

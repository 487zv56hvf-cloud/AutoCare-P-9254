import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/**
 * Cloud backup of a signed-in user's car. `plateKey` is the normalized Egyptian plate
 * (letters + digits, no spaces) so the owner can restore the car on a new phone by typing it.
 * Plates are only ever looked up inside the signed-in user's own rows.
 */
export const vehicleBackup = sqliteTable(
  "vehicle_backup",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    plateKey: text("plate_key"),
    title: text("title").notNull(),
    data: text("data").notNull(), // JSON of the Vehicle object
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [index("vehicle_backup_user_idx").on(t.userId), uniqueIndex("vehicle_backup_user_plate_uq").on(t.userId, t.plateKey)],
);

/** In-app support chat. Messages are kept so the owner can review questions the assistant could not answer. */
export const supportMessage = sqliteTable(
  "support_message",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    conversationId: text("conversation_id").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    needsHuman: integer("needs_human", { mode: "boolean" }).default(false).notNull(),
    /** Set on every message of a conversation when the owner marks it done. */
    handled: integer("handled", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [index("support_message_conv_idx").on(t.conversationId)],
);

/** Feedback sent from the app's Feedback screen. Always saved; the owner is also emailed when email is set up. */
export const feedback = sqliteTable(
  "feedback",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    kind: text("kind", { enum: ["idea", "problem", "other"] }).notNull(),
    rating: integer("rating"), // 1-5, optional
    message: text("message").notNull(),
    contact: text("contact"), // optional email/phone the sender typed
    car: text("car"),
    lang: text("lang"),
    emailed: integer("emailed", { mode: "boolean" }).default(false).notNull(),
    read: integer("read", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [index("feedback_created_idx").on(t.createdAt)],
);

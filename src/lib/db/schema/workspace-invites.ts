import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { users } from "./auth";
import { workspaces } from "./workspaces";
import type { WorkspaceMemberRole } from "@/types/domain";

export const workspaceInvites = sqliteTable("workspaceInvite", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workspaceId: text("workspaceId")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  workspaceName: text("workspaceName").notNull(),
  invitedEmail: text("invitedEmail").notNull(),
  invitedBy: text("invitedBy")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  inviterName: text("inviterName").notNull(),
  role: text("role").$type<WorkspaceMemberRole>().notNull(),
  status: text("status")
    .$type<"pending" | "accepted" | "declined" | "expired">()
    .notNull()
    .default("pending"),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { users } from "./auth";
import type {
  WorkspacePlan,
  WorkspaceStatus,
  WorkspaceMemberRole,
} from "@/types/domain";

export const workspaces = sqliteTable("workspace", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  ownerUserId: text("ownerUserId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),

  plan: text("plan").$type<WorkspacePlan>().notNull().default("free"),
  status: text("status").$type<WorkspaceStatus>().notNull().default("trial"),

  // Billing (flattened from WorkspaceDocument.billing)
  billingStripeCustomerId: text("billingStripeCustomerId"),
  billingStripeSubscriptionId: text("billingStripeSubscriptionId"),
  billingCurrentPeriodEnd: integer("billingCurrentPeriodEnd", { mode: "timestamp_ms" }),
  // Phase 4.5 — additional Stripe billing fields used by webhook + guards
  billingSubscriptionStatus: text("billingSubscriptionStatus"),
  billingLastPaymentFailedAt: integer("billingLastPaymentFailedAt", { mode: "timestamp_ms" }),
  billingCanceledAt: integer("billingCanceledAt", { mode: "timestamp_ms" }),
  trialEndsAt: integer("trialEndsAt", { mode: "timestamp_ms" }),

  // Usage (flattened from WorkspaceDocument.usage; denormalized for limit checks)
  usagePlayerCount: integer("usagePlayerCount").notNull().default(0),
  usageGamesThisMonth: integer("usageGamesThisMonth").notNull().default(0),
  usageStorageUsedMB: integer("usageStorageUsedMB").notNull().default(0),

  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
  deletedAt: integer("deletedAt", { mode: "timestamp_ms" }),
});

// Junction table — was WorkspaceDocument.members[] in Firestore.
// Split out so we can query "what workspaces does user X belong to" efficiently.
export const workspaceMembers = sqliteTable(
  "workspaceMember",
  {
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").$type<WorkspaceMemberRole>().notNull(),
    addedAt: integer("addedAt", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    addedBy: text("addedBy")
      .notNull()
      .references(() => users.id, { onDelete: "no action" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.workspaceId, table.userId] }),
  })
);

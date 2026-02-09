import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Activity Feed - tracks every action
  activities: defineTable({
    timestamp: v.number(), // Unix timestamp
    actionType: v.string(), // e.g., "file_read", "task_created", "message_sent"
    details: v.string(), // Description of the action
    result: v.string(), // Success/failure or outcome
    metadata: v.optional(v.record(v.string(), v.any())), // Additional data
    userId: v.optional(v.string()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_actionType", ["actionType"])
    .searchIndex("search_details", {
      searchField: "details",
    }),

  // Tasks - scheduled tasks, reminders, cron jobs
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("reminder"), v.literal("task"), v.literal("event")),
    scheduledAt: v.number(), // Unix timestamp
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("cancelled")),
    recurrence: v.optional(v.string()), // cron pattern or recurrence rule
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    userId: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
  })
    .index("by_scheduledAt", ["scheduledAt"])
    .index("by_type", ["type"])
    .index("by_status", ["status"]),

  // Search index for memory/documents
  documents: defineTable({
    title: v.string(),
    content: v.string(),
    category: v.union(v.literal("memory"), v.literal("document"), v.literal("note")),
    createdAt: v.number(),
    updatedAt: v.number(),
    userId: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
  })
    .index("by_category", ["category"])
    .index("by_createdAt", ["createdAt"])
    .searchIndex("search_content", {
      searchField: "content",
    })
    .searchIndex("search_title", {
      searchField: "title",
    }),
});

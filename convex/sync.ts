import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const syncWorkspaceFiles = mutation({
  args: {
    files: v.array(
      v.object({
        title: v.string(),
        content: v.string(),
        category: v.union(v.literal("memory"), v.literal("document"), v.literal("note")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let upserted = 0;

    for (const file of args.files) {
      // Check if document with same title exists
      const existing = await ctx.db
        .query("documents")
        .withSearchIndex("search_title", (q) => q.search("title", file.title))
        .first();

      if (existing && existing.title === file.title) {
        await ctx.db.patch(existing._id, {
          content: file.content,
          category: file.category,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("documents", {
          title: file.title,
          content: file.content,
          category: file.category,
          createdAt: now,
          updatedAt: now,
        });
      }
      upserted++;
    }

    return { upserted };
  },
});

export const syncCronJobs = mutation({
  args: {
    jobs: v.array(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
        type: v.union(v.literal("reminder"), v.literal("task"), v.literal("event")),
        scheduledAt: v.number(),
        status: v.union(v.literal("pending"), v.literal("completed"), v.literal("cancelled")),
        priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Clear existing tasks and replace
    const existing = await ctx.db.query("tasks").collect();
    for (const task of existing) {
      await ctx.db.delete(task._id);
    }

    let inserted = 0;
    for (const job of args.jobs) {
      await ctx.db.insert("tasks", {
        title: job.title,
        description: job.description,
        type: job.type,
        scheduledAt: job.scheduledAt,
        status: job.status,
        priority: job.priority,
      });
      inserted++;
    }

    return { inserted };
  },
});

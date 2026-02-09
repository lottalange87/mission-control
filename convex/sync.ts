import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================================================
// LEGACY MUTATIONS (keeping for backward compatibility)
// ============================================================================

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
          category: file.category as any,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("documents", {
          title: file.title,
          path: file.title,
          content: file.content,
          hash: "",
          category: file.category as any,
          size: 0,
          createdAt: now,
          updatedAt: now,
          lastModified: now,
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

// ============================================================================
// FILE SYNC MUTATIONS (Phase 1)
// ============================================================================

/**
 * Sync a single file to Convex
 * Upserts the file - creates if new, updates if hash changed
 */
export const syncFile = mutation({
  args: {
    path: v.string(),
    content: v.string(),
    hash: v.string(),
    category: v.union(v.literal("memory"), v.literal("document"), v.literal("note"), v.literal("config"), v.literal("project")),
    lastModified: v.number(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if file already exists by path
    const existing = await ctx.db
      .query("documents")
      .withIndex("by_path", (q) => q.eq("path", args.path))
      .first();

    // Extract title from path (filename without extension)
    const title = args.path.split("/").pop()?.replace(/\.[^/.]+$/, "") || args.path;

    if (existing) {
      // Only update if hash changed
      if (existing.hash !== args.hash) {
        await ctx.db.patch(existing._id, {
          title,
          content: args.content,
          hash: args.hash,
          category: args.category,
          lastModified: args.lastModified,
          size: args.size,
          updatedAt: now,
        });
        return { action: "updated", id: existing._id };
      }
      return { action: "unchanged", id: existing._id };
    } else {
      // Insert new file
      const id = await ctx.db.insert("documents", {
        title,
        path: args.path,
        content: args.content,
        hash: args.hash,
        category: args.category,
        size: args.size,
        createdAt: now,
        updatedAt: now,
        lastModified: args.lastModified,
      });
      return { action: "created", id };
    }
  },
});

/**
 * Delete a file from Convex by path
 */
export const deleteFile = mutation({
  args: {
    path: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("documents")
      .withIndex("by_path", (q) => q.eq("path", args.path))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { deleted: true, id: existing._id };
    }
    return { deleted: false, reason: "not_found" };
  },
});

/**
 * Get file by path - returns file info including current hash
 */
export const getFileByPath = query({
  args: {
    path: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("documents")
      .withIndex("by_path", (q) => q.eq("path", args.path))
      .first();

    if (!file) {
      return null;
    }

    return {
      id: file._id,
      path: file.path,
      hash: file.hash,
      category: file.category,
      lastModified: file.lastModified,
      size: file.size,
      updatedAt: file.updatedAt,
    };
  },
});

/**
 * Get all synced file paths (for cleanup of deleted files)
 */
export const getAllSyncedPaths = query({
  args: {},
  handler: async (ctx) => {
    const files = await ctx.db.query("documents").collect();
    return files.map((f) => ({
      path: f.path,
      hash: f.hash,
      updatedAt: f.updatedAt,
    }));
  },
});

/**
 * Batch sync multiple files
 */
export const syncFilesBatch = mutation({
  args: {
    files: v.array(
      v.object({
        path: v.string(),
        content: v.string(),
        hash: v.string(),
        category: v.union(v.literal("memory"), v.literal("document"), v.literal("note"), v.literal("config"), v.literal("project")),
        lastModified: v.number(),
        size: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = {
      created: 0,
      updated: 0,
      unchanged: 0,
      errors: [] as string[],
    };

    const now = Date.now();

    for (const file of args.files) {
      try {
        // Check if file already exists by path
        const existing = await ctx.db
          .query("documents")
          .withIndex("by_path", (q) => q.eq("path", file.path))
          .first();

        // Extract title from path (filename without extension)
        const title = file.path.split("/").pop()?.replace(/\.[^/.]+$/, "") || file.path;

        if (existing) {
          // Only update if hash changed
          if (existing.hash !== file.hash) {
            await ctx.db.patch(existing._id, {
              title,
              content: file.content,
              hash: file.hash,
              category: file.category,
              lastModified: file.lastModified,
              size: file.size,
              updatedAt: now,
            });
            results.updated++;
          } else {
            results.unchanged++;
          }
        } else {
          // Insert new file
          await ctx.db.insert("documents", {
            title,
            path: file.path,
            content: file.content,
            hash: file.hash,
            category: file.category,
            size: file.size,
            createdAt: now,
            updatedAt: now,
            lastModified: file.lastModified,
          });
          results.created++;
        }
      } catch (error) {
        results.errors.push(`${file.path}: ${error}`);
      }
    }

    return results;
  },
});

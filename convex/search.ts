import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Global search across all content types
export const globalSearch = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const searchLower = args.query.toLowerCase();
    
    // Search activities
    const activities = await ctx.db
      .query("activities")
      .withSearchIndex("search_details", (q) => 
        q.search("details", args.query)
      )
      .take(limit);
    
    // Search documents by content
    const documentsByContent = await ctx.db
      .query("documents")
      .withSearchIndex("search_content", (q) => 
        q.search("content", args.query)
      )
      .take(limit);
    
    // Search documents by title
    const documentsByTitle = await ctx.db
      .query("documents")
      .withSearchIndex("search_title", (q) => 
        q.search("title", args.query)
      )
      .take(limit);
    
    // Search tasks (manual search for now)
    const allTasks = await ctx.db.query("tasks").collect();
    const matchingTasks = allTasks
      .filter((task) => 
        task.title.toLowerCase().includes(searchLower) ||
        (task.description?.toLowerCase().includes(searchLower) ?? false)
      )
      .slice(0, limit);
    
    return {
      activities: activities.map((a) => ({ ...a, _type: "activity" as const })),
      documents: [...documentsByContent, ...documentsByTitle]
        .filter((doc, index, self) => 
          index === self.findIndex((d) => d._id === doc._id)
        )
        .map((d) => ({ ...d, _type: "document" as const })),
      tasks: matchingTasks.map((t) => ({ ...t, _type: "task" as const })),
    };
  },
});

// Create a document
export const createDocument = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.union(v.literal("memory"), v.literal("document"), v.literal("note")),
    userId: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const docId = await ctx.db.insert("documents", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return docId;
  },
});

// Get documents by category
export const getDocumentsByCategory = query({
  args: {
    category: v.union(v.literal("memory"), v.literal("document"), v.literal("note")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .order("desc")
      .take(args.limit ?? 50);
    
    return docs;
  },
});

// Get recent documents
export const getRecentDocuments = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_createdAt")
      .order("desc")
      .take(args.limit ?? 20);
    
    return docs;
  },
});

// Update document
export const updateDocument = mutation({
  args: {
    docId: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const { docId, ...updates } = args;
    await ctx.db.patch(docId, {
      ...updates,
      updatedAt: Date.now(),
    });
    return docId;
  },
});

// Delete document
export const deleteDocument = mutation({
  args: {
    docId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.docId);
    return args.docId;
  },
});

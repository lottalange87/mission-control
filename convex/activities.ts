import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query activities with filters and pagination
export const getActivities = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    actionType: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    // Start building the query
    let results;
    
    if (args.searchQuery) {
      // Use search for text queries
      results = await ctx.db
        .query("activities")
        .withSearchIndex("search_details", (q) => q.search("details", args.searchQuery!))
        .take(limit);
    } else if (args.actionType) {
      results = await ctx.db
        .query("activities")
        .withIndex("by_actionType", (q) => q.eq("actionType", args.actionType!))
        .order("desc")
        .take(limit);
    } else {
      results = await ctx.db
        .query("activities")
        .withIndex("by_timestamp")
        .order("desc")
        .take(limit);
    }

    return results;
  },
});

// Log a new activity
export const logActivity = mutation({
  args: {
    actionType: v.string(),
    details: v.string(),
    result: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const activityId = await ctx.db.insert("activities", {
      timestamp: Date.now(),
      actionType: args.actionType,
      details: args.details,
      result: args.result,
      metadata: args.metadata,
      userId: args.userId,
    });
    return activityId;
  },
});

// Get activity counts by type
export const getActivityStats = query({
  args: {},
  handler: async (ctx) => {
    const activities = await ctx.db.query("activities").collect();
    
    const stats: Record<string, number> = {};
    activities.forEach((activity) => {
      stats[activity.actionType] = (stats[activity.actionType] || 0) + 1;
    });
    
    return stats;
  },
});

// Get unique action types
export const getActionTypes = query({
  args: {},
  handler: async (ctx) => {
    const activities = await ctx.db.query("activities").collect();
    const types = new Set(activities.map((a) => a.actionType));
    return Array.from(types);
  },
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get tasks for a specific week
export const getTasksForWeek = query({
  args: {
    weekStart: v.number(), // Start of week timestamp
    weekEnd: v.number(),   // End of week timestamp
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_scheduledAt", (q) => 
        q.gte("scheduledAt", args.weekStart).lte("scheduledAt", args.weekEnd)
      )
      .order("asc")
      .collect();
    
    return tasks;
  },
});

// Get upcoming tasks
export const getUpcomingTasks = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_scheduledAt", (q) => q.gte("scheduledAt", now))
      .order("asc")
      .take(args.limit ?? 10);
    
    return tasks;
  },
});

// Create a new task
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("reminder"), v.literal("task"), v.literal("event")),
    scheduledAt: v.number(),
    recurrence: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    userId: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      ...args,
      status: "pending",
    });
    return taskId;
  },
});

// Update task status
export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("cancelled")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, { status: args.status });
    return args.taskId;
  },
});

// Delete task
export const deleteTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
    return args.taskId;
  },
});

// Get tasks by type
export const getTasksByType = query({
  args: {
    type: v.union(v.literal("reminder"), v.literal("task"), v.literal("event")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .order("desc")
      .take(args.limit ?? 50);
    
    return tasks;
  },
});

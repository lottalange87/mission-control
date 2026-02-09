import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/log",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { actionType, details, result, metadata } = body;

    if (!actionType || !details || !result) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: actionType, details, result" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const id = await ctx.runMutation(api.activities.logActivity, {
      actionType,
      details,
      result,
      metadata,
    });

    return new Response(
      JSON.stringify({ success: true, id }),
      { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }),
});

http.route({
  path: "/log",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

// File Sync HTTP Routes
http.route({
  path: "/sync/file",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { path, content, hash, category, lastModified, size } = body;

    if (!path || !content || !hash) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: path, content, hash" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await ctx.runMutation(api.sync.syncFile, {
      path,
      content,
      hash,
      category,
      lastModified,
      size,
    });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }),
});

http.route({
  path: "/sync/file",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

// Get file by path
http.route({
  path: "/sync/file",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const path = url.searchParams.get("path");

    if (!path) {
      return new Response(
        JSON.stringify({ error: "Missing path parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await ctx.runQuery(api.sync.getFileByPath, { path });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }),
});

// Get all synced paths
http.route({
  path: "/sync/files",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const result = await ctx.runQuery(api.sync.getAllSyncedPaths, {});

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }),
});

// Delete file
http.route({
  path: "/sync/file",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const path = url.searchParams.get("path");

    if (!path) {
      return new Response(
        JSON.stringify({ error: "Missing path parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await ctx.runMutation(api.sync.deleteFile, { path });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }),
});

export default http;

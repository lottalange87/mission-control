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

export default http;

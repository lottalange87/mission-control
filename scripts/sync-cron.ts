#!/usr/bin/env ts-node
/**
 * Cron Job Sync Script
 * Reads cron job JSON from stdin or file and syncs to Convex tasks table
 * Phase 2 of Mission Control Workspace Sync Plan
 * 
 * Usage: echo '<json>' | npx ts-node --project tsconfig.scripts.json scripts/sync-cron.ts
 *    or: npx ts-node --project tsconfig.scripts.json scripts/sync-cron.ts --file cron-jobs.json
 */

const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL || "https://abundant-sardine-148.convex.site";

interface CronJob {
  id: string;
  name?: string;
  enabled: boolean;
  schedule: {
    kind: string;
    expr?: string;
    tz?: string;
    at?: string;
    everyMs?: number;
  };
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: string;
    lastError?: string;
    consecutiveErrors?: number;
  };
}

function describeSchedule(schedule: CronJob["schedule"]): string {
  if (schedule.kind === "cron" && schedule.expr) {
    return `cron: ${schedule.expr}${schedule.tz ? ` (${schedule.tz})` : ""}`;
  }
  if (schedule.kind === "every" && schedule.everyMs) {
    const hours = schedule.everyMs / 3600000;
    const mins = schedule.everyMs / 60000;
    if (hours >= 1) return `every ${hours}h`;
    return `every ${mins}m`;
  }
  if (schedule.kind === "at" && schedule.at) {
    return `at ${schedule.at}`;
  }
  return JSON.stringify(schedule);
}

async function readInput(): Promise<string> {
  const fs = require("fs");
  
  // Check for --file argument
  const fileArgIdx = process.argv.indexOf("--file");
  if (fileArgIdx !== -1 && process.argv[fileArgIdx + 1]) {
    return fs.readFileSync(process.argv[fileArgIdx + 1], "utf-8");
  }

  // Read from stdin
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk: string) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    // Timeout after 5 seconds if no stdin
    setTimeout(() => resolve(data), 5000);
  });
}

async function main() {
  console.log("=".repeat(60));
  console.log("  Cron Job Sync - Phase 2");
  console.log("=".repeat(60));
  console.log();

  const input = await readInput();
  
  if (!input.trim()) {
    console.log("⚠️  No input. Provide cron jobs as JSON via stdin or --file.");
    process.exit(1);
  }

  let jobs: CronJob[];
  try {
    const parsed = JSON.parse(input.trim());
    jobs = Array.isArray(parsed) ? parsed : parsed.jobs || [];
  } catch (e) {
    console.error("❌ Failed to parse JSON input:", e);
    process.exit(1);
  }

  console.log(`📋 Found ${jobs.length} cron jobs:\n`);
  for (const job of jobs) {
    const status = job.enabled ? "✅" : "❌";
    console.log(`  ${status} ${job.name || job.id} — ${describeSchedule(job.schedule)}`);
    if (job.state?.lastStatus) {
      console.log(`     Last: ${job.state.lastStatus}${job.state?.lastError ? ` (${job.state.lastError})` : ""}`);
    }
  }

  // Map to Convex task format
  const tasks = jobs.map((job) => ({
    title: job.name || `Cron ${job.id.substring(0, 8)}`,
    description: `${describeSchedule(job.schedule)} | ${job.enabled ? "enabled" : "disabled"} | ${job.state?.lastStatus || "unknown"}${job.state?.lastError ? ` | Error: ${job.state.lastError}` : ""}`,
    type: "task" as const,
    scheduledAt: job.state?.nextRunAtMs || Date.now(),
    status: job.enabled ? ("pending" as const) : ("cancelled" as const),
    priority: "medium" as const,
  }));

  console.log("\n🚀 Syncing to Convex...\n");

  const response = await fetch(`${CONVEX_SITE_URL}/sync/cron`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobs: tasks }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`❌ Sync failed: ${response.status} ${err}`);
    process.exit(1);
  }

  const result = (await response.json()) as { inserted: number };

  // Log to Mission Control
  await fetch(`${CONVEX_SITE_URL}/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      actionType: "cron_sync",
      details: `Synced ${result.inserted} cron jobs to Convex tasks`,
      result: "success",
    }),
  });

  console.log("=".repeat(60));
  console.log(`  ✅ Synced ${result.inserted} cron jobs`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err);
  process.exit(1);
});

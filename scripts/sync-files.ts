#!/usr/bin/env ts-node
/**
 * Workspace File Sync Script
 * Scans workspace files and syncs them to Convex
 * Phase 1 of Mission Control Workspace Sync Plan
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// ============================================================================
// CONFIGURATION
// ============================================================================

// Workspace root is 2 levels up from apps/mission-control/scripts/
const WORKSPACE_ROOT = path.resolve(__dirname, "../../..");
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://abundant-sardine-148.convex.cloud";
const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL || "https://abundant-sardine-148.convex.site";

// Directories to scan (relative to workspace root)
const SCAN_DIRS = ["memory", "projects", "apps"];

// Root files to sync
const ROOT_FILES = ["AGENTS.md", "TOOLS.md", "MEMORY.md", "SOUL.md", "USER.md"];

// File patterns to ignore
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /\.next/,
  /out/,
  /dist/,
  /build/,
  /\.log$/,
  /\.tmp$/,
  /\.swp$/,
  /\.DS_Store$/,
  /\~$/,
  /^\./, // hidden files
];

// File extensions to sync
const ALLOWED_EXTENSIONS = [".md", ".txt", ".json", ".ts", ".tsx", ".js", ".jsx", ".yml", ".yaml"];

// Batch size for uploads
const BATCH_SIZE = 100;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// ============================================================================
// TYPES
// ============================================================================

type FileCategory = "memory" | "document" | "config" | "project";

interface FileInfo {
  absolutePath: string;
  relativePath: string;
  content: string;
  hash: string;
  category: FileCategory;
  lastModified: number;
  size: number;
}

interface SyncResult {
  created: number;
  updated: number;
  unchanged: number;
  deleted: number;
  errors: string[];
  total: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Calculate MD5 hash of content
 */
function calculateHash(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex");
}

/**
 * Check if a path should be ignored
 */
function shouldIgnore(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, "/");
  return IGNORE_PATTERNS.some((pattern) => pattern.test(normalizedPath));
}

/**
 * Check if file extension is allowed
 */
function isAllowedExtension(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Determine file category based on path
 */
function getCategory(relativePath: string): FileCategory {
  const parts = relativePath.split("/");
  const firstPart = parts[0];

  if (firstPart === "memory") return "memory";
  if (["AGENTS.md", "TOOLS.md", "MEMORY.md", "SOUL.md", "USER.md"].includes(parts[parts.length - 1])) {
    return "config";
  }
  if (firstPart === "projects") return "project";
  if (firstPart === "apps") return "project";

  return "document";
}

/**
 * Delay function for retries
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Log to Mission Control
 */
async function logToMissionControl(
  actionType: string,
  details: string,
  result: "success" | "error" = "success"
): Promise<void> {
  try {
    await fetch(`${CONVEX_SITE_URL}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionType, details, result }),
    });
  } catch (error) {
    console.error("Failed to log to Mission Control:", error);
  }
}

/**
 * Call Convex mutation via HTTP
 */
async function convexMutation(
  mutationPath: string,
  args: Record<string, any>
): Promise<any> {
  const url = `${CONVEX_URL}/api/mutation`;
  
  // Try the Convex action/mutation format
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: mutationPath,
      args,
    }),
  });

  const responseText = await response.text();
  
  if (!response.ok) {
    throw new Error(`Convex mutation failed: ${response.status} ${responseText}`);
  }

  // Convex returns the result directly
  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}

/**
 * Call Convex query via HTTP
 */
async function convexQuery(
  queryPath: string,
  args: Record<string, any>
): Promise<any> {
  const url = `${CONVEX_URL}/api/query`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: queryPath,
      args,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Convex query failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

// ============================================================================
// FILE SCANNING
// ============================================================================

/**
 * Recursively scan a directory for files
 */
function scanDirectory(dirPath: string, baseDir: string): FileInfo[] {
  const files: FileInfo[] = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(WORKSPACE_ROOT, fullPath);

      if (shouldIgnore(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        files.push(...scanDirectory(fullPath, baseDir));
      } else if (entry.isFile() && isAllowedExtension(entry.name)) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          const stats = fs.statSync(fullPath);

          files.push({
            absolutePath: fullPath,
            relativePath: relativePath.replace(/\\/g, "/"),
            content,
            hash: calculateHash(content),
            category: getCategory(relativePath),
            lastModified: stats.mtimeMs,
            size: stats.size,
          });
        } catch (error) {
          console.warn(`Failed to read file ${relativePath}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Failed to scan directory ${dirPath}:`, error);
  }

  return files;
}

/**
 * Scan root files
 */
function scanRootFiles(): FileInfo[] {
  const files: FileInfo[] = [];

  for (const fileName of ROOT_FILES) {
    const fullPath = path.join(WORKSPACE_ROOT, fileName);

    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        const stats = fs.statSync(fullPath);

        files.push({
          absolutePath: fullPath,
          relativePath: fileName,
          content,
          hash: calculateHash(content),
          category: "config",
          lastModified: stats.mtimeMs,
          size: stats.size,
        });
      } catch (error) {
        console.warn(`Failed to read root file ${fileName}:`, error);
      }
    }
  }

  return files;
}

/**
 * Scan all configured directories and files
 */
function scanWorkspace(): FileInfo[] {
  console.log("🔍 Scanning workspace...\n");

  const allFiles: FileInfo[] = [];

  // Scan root files
  console.log("Scanning root files...");
  const rootFiles = scanRootFiles();
  allFiles.push(...rootFiles);
  console.log(`  Found ${rootFiles.length} root files`);

  // Scan directories
  for (const dir of SCAN_DIRS) {
    const fullDirPath = path.join(WORKSPACE_ROOT, dir);

    if (fs.existsSync(fullDirPath)) {
      console.log(`Scanning ${dir}/...`);
      const dirFiles = scanDirectory(fullDirPath, WORKSPACE_ROOT);
      allFiles.push(...dirFiles);
      console.log(`  Found ${dirFiles.length} files`);
    } else {
      console.log(`Directory ${dir}/ does not exist, skipping`);
    }
  }

  console.log(`\n📊 Total files found: ${allFiles.length}\n`);
  return allFiles;
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Execute with retry logic
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${MAX_RETRIES}):`, lastError.message);

      if (attempt < MAX_RETRIES) {
        const delayMs = RETRY_DELAY_MS * attempt; // Exponential backoff
        console.log(`  Retrying in ${delayMs}ms...`);
        await delay(delayMs);
      }
    }
  }

  throw new Error(`${operationName} failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

/**
 * Sync a single file to Convex
 */
async function syncFileToConvex(
  file: FileInfo
): Promise<{ action: string; path: string }> {
  const result = await convexMutation("sync/syncFile", {
    path: file.relativePath,
    content: file.content,
    hash: file.hash,
    category: file.category,
    lastModified: file.lastModified,
    size: file.size,
  });
  
  // Debug: log first few results
  if (Math.random() < 0.1) {
    console.log(`\nDebug: result for ${file.relativePath}:`, JSON.stringify(result));
  }

  return { action: result?.action || "unknown", path: file.relativePath };
}

/**
 * Get all synced paths from Convex (for cleanup)
 */
async function getSyncedPaths(): Promise<Array<{ path: string; hash: string }>> {
  const result = await convexQuery("sync/getAllSyncedPaths", {});
  // Handle Convex response format - result might be wrapped in a value field
  const paths = Array.isArray(result) ? result : result?.value || [];
  return paths;
}

/**
 * Delete a file from Convex
 */
async function deleteFileFromConvex(
  filePath: string
): Promise<boolean> {
  const result = await convexMutation("sync/deleteFile", { path: filePath });
  return result.deleted;
}

/**
 * Sync files in batches
 */
async function syncFilesInBatches(
  files: FileInfo[]
): Promise<SyncResult> {
  const result: SyncResult = {
    created: 0,
    updated: 0,
    unchanged: 0,
    deleted: 0,
    errors: [],
    total: files.length,
  };

  // Process in batches
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(files.length / BATCH_SIZE);

    console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} files)...`);

    for (const file of batch) {
      try {
        const syncResult = await withRetry(
          () => syncFileToConvex(file),
          `Sync ${file.relativePath}`
        );

        if (syncResult.action === "created") result.created++;
        else if (syncResult.action === "updated") result.updated++;
        else if (syncResult.action === "unchanged") result.unchanged++;

        process.stdout.write(syncResult.action === "created" ? "+" : syncResult.action === "updated" ? "~" : ".");
      } catch (error) {
        result.errors.push(`${file.relativePath}: ${error}`);
        process.stdout.write("!");
      }
    }

    console.log(" Done");
  }

  return result;
}

/**
 * Clean up deleted files (optional)
 */
async function cleanupDeletedFiles(
  currentFiles: FileInfo[],
  dryRun: boolean = true
): Promise<number> {
  const currentPaths = new Set(currentFiles.map((f) => f.relativePath));
  const syncedPaths = await getSyncedPaths();

  const toDelete = syncedPaths.filter((s) => !currentPaths.has(s.path));

  if (toDelete.length === 0) {
    return 0;
  }

  console.log(`\n🗑️  Found ${toDelete.length} files to delete (dryRun: ${dryRun})`);

  if (dryRun) {
    for (const file of toDelete.slice(0, 10)) {
      console.log(`  - ${file.path}`);
    }
    if (toDelete.length > 10) {
      console.log(`  ... and ${toDelete.length - 10} more`);
    }
    return toDelete.length;
  }

  let deleted = 0;
  for (const file of toDelete) {
    try {
      const success = await withRetry(
        () => deleteFileFromConvex(file.path),
        `Delete ${file.path}`
      );
      if (success) deleted++;
    } catch (error) {
      console.error(`Failed to delete ${file.path}:`, error);
    }
  }

  return deleted;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("=".repeat(60));
  console.log("  Workspace File Sync - Phase 1");
  console.log("=".repeat(60));
  console.log();

  const startTime = Date.now();

  // Scan workspace
  const files = scanWorkspace();

  if (files.length === 0) {
    console.log("⚠️  No files found to sync");
    await logToMissionControl("workspace_sync", "No files found to sync", "error");
    process.exit(1);
  }

  // Show sample files
  console.log("Sample files to sync:");
  files.slice(0, 5).forEach((f) => {
    console.log(`  - [${f.category}] ${f.relativePath} (${f.size} bytes)`);
  });
  if (files.length > 5) {
    console.log(`  ... and ${files.length - 5} more`);
  }
  console.log();

  // Sync files
  console.log("🚀 Starting sync...\n");
  const result = await syncFilesInBatches(files);

  // Optional: Cleanup deleted files (dry run for now)
  let deletableCount = 0;
  try {
    deletableCount = await cleanupDeletedFiles(files, true);
  } catch (error) {
    console.log("\n⚠️  Cleanup check skipped (query not available)");
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n" + "=".repeat(60));
  console.log("  Sync Complete");
  console.log("=".repeat(60));
  console.log(`  Created:    ${result.created}`);
  console.log(`  Updated:    ${result.updated}`);
  console.log(`  Unchanged:  ${result.unchanged}`);
  console.log(`  Errors:     ${result.errors.length}`);
  console.log(`  Deletable:  ${deletableCount} (dry run)`);
  console.log(`  Duration:   ${duration}s`);
  console.log("=".repeat(60));

  // Log to Mission Control
  const summary = `Synced ${result.total} files: ${result.created} created, ${result.updated} updated, ${result.unchanged} unchanged, ${result.errors.length} errors`;
  await logToMissionControl("workspace_sync", summary, result.errors.length > 0 ? "error" : "success");

  // Show errors if any
  if (result.errors.length > 0) {
    console.log("\n❌ Errors:");
    result.errors.slice(0, 10).forEach((e) => console.log(`  - ${e}`));
    if (result.errors.length > 10) {
      console.log(`  ... and ${result.errors.length - 10} more`);
    }
    process.exit(1);
  }

  console.log("\n✅ Sync completed successfully!");
  process.exit(0);
}

// Run main
main().catch(async (error) => {
  console.error("\n💥 Fatal error:", error);
  await logToMissionControl("workspace_sync", `Fatal error: ${error.message}`, "error");
  process.exit(1);
});

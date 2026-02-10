#!/bin/bash
# Workspace Sync - runs file sync and cron sync
# Phase 3: Automation script for cron job execution

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MC_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔄 Starting workspace sync..."
echo ""

# Phase 1: File Sync
echo "📁 Phase 1: File Sync"
cd "$MC_DIR"
npx ts-node --project tsconfig.scripts.json scripts/sync-files.ts
echo ""

# Phase 2: Cron Sync (will be fed JSON by the cron job agent)
echo "📋 Phase 2: Cron Sync skipped (requires cron job data from agent)"
echo ""

echo "✅ Workspace sync complete!"

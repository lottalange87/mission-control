"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { RefreshCw } from "lucide-react";

function timeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "gerade eben";
  if (mins < 60) return `vor ${mins}m`;
  if (hours < 24) return `vor ${hours}h ${mins % 60}m`;
  return `vor ${days}d`;
}

export function SyncStatus() {
  const lastSync = useQuery(api.activities.getLastSync);

  if (!lastSync) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3" />
        <span>Noch kein Sync</span>
      </div>
    );
  }

  const isRecent = Date.now() - lastSync.timestamp < 5 * 3600000; // < 5h
  const isError = lastSync.result === "error";

  return (
    <div
      className={`flex items-center gap-1.5 text-xs ${
        isError
          ? "text-red-500"
          : isRecent
          ? "text-green-500"
          : "text-muted-foreground"
      }`}
      title={`Last sync: ${new Date(lastSync.timestamp).toLocaleString("de-DE")}\n${lastSync.details}`}
    >
      <RefreshCw className={`h-3 w-3 ${isRecent && !isError ? "animate-none" : ""}`} />
      <span>
        Sync: {timeAgo(lastSync.timestamp)}
        {isError && " ⚠️"}
      </span>
    </div>
  );
}

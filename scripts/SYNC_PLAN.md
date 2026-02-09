# Mission Control Workspace Sync Plan

## Ziel
Automatische Synchronisation von Workspace-Dateien und Cron-Jobs zu Convex, damit Mission Control immer aktuelle Daten hat.

## Komponenten

### 1. File Scanner (`scripts/sync-files.ts`)
**Was es tut:**
- Scannt Verzeichnisse: `memory/`, `projects/`, `apps/`, `AGENTS.md`, `TOOLS.md`, `MEMORY.md`, etc.
- Berechnet MD5-Hash pro Datei (für Change-Detection)
- Vergleicht mit Convex: Nur geänderte/neue Dateien uploaden
- Löscht in Convex entfernte Dateien (optional)

**Datei-Metadaten die gespeichert werden:**
- `path`: Relativer Pfad (z.B. "memory/2026-02-09.md")
- `content`: Datei-Inhalt (für Search)
- `hash`: MD5-Hash (für Change-Detection)
- `category`: "memory" | "document" | "config" | "project"
- `lastModified`: Timestamp
- `size`: Bytes

**Kategorien-Mapping:**
- `memory/*.md` → category: "memory"
- `AGENTS.md`, `TOOLS.md`, `MEMORY.md`, `SOUL.md`, `USER.md` → category: "config"
- `projects/*/` → category: "project"
- `apps/*/` → category: "project"

### 2. Cron Job Sync (`scripts/sync-cron.ts`)
**Was es tut:**
- Liest alle Cron-Jobs via `cron.list`
- Synced zu Convex `tasks` Tabelle
- Markiert Jobs als "recurring" mit cron expression

**Task-Format:**
- `title`: Job-Name
- `description`: Payload-Zusammenfassung
- `type`: "reminder" | "task" | "event"
- `scheduledAt`: Nächster Lauf (berechnet aus cron)
- `recurrence`: Cron expression
- `status`: "pending" | "completed" | "cancelled"
- `priority`: "low" | "medium" | "high"

### 3. Convex Mutations (erweitern)
**Neue/erweiterte Endpunkte:**

```typescript
// convex/sync.ts

// File Sync
syncFile: mutation({
  args: { path, content, hash, category, lastModified, size },
  handler: async (ctx, args) => {
    // Upsert: Insert if new, update if hash changed
  }
})

deleteFile: mutation({
  args: { path },
  handler: async (ctx, args) => {
    // Delete by path
  }
})

// Cron Sync
syncCronJob: mutation({
  args: { jobId, title, description, type, scheduledAt, recurrence, priority },
  handler: async (ctx, args) => {
    // Upsert task
  }
})
```

### 4. Scheduler
**Optionen:**

**A) OpenClaw Cron Job (bevorzugt)**
- Neue Cron-Job: "Mission Control Sync"
- Schedule: Alle 4 Stunden (`0 */4 * * *`)
- Action: Führt `scripts/sync-all.ts` aus

**B) Node.js Script + systemd (falls Cron nicht reicht)**
- Eigener Prozess auf Mac mini
- Läuft als systemd service
- Mehr Kontrolle über Fehlerbehandlung

### 5. Sync-All Script (`scripts/sync-all.ts`)
**Orchestriert:**
1. File Scanner ausführen
2. Cron Sync ausführen
3. Ergebnisse loggen
4. Bei Fehlern: Retry-Logik

### 6. Logging & Monitoring
- Jeder Sync-Vorgang wird zu Mission Control geloggt
- Erfolg: "Synced X files, Y cron jobs"
- Fehler: Detaillierte Error-Meldung
- Letzter Sync-Timestamp in Convex speichern

## Implementierungs-Reihenfolge

1. **Phase 1: File Sync MVP**
   - `scripts/sync-files.ts` bauen
   - Convex mutations erweitern
   - Einmalig manuell testen

2. **Phase 2: Cron Sync**
   - `scripts/sync-cron.ts` bauen
   - Mit bestehenden Tasks integrieren

3. **Phase 3: Automatisierung**
   - Cron-Job einrichten
   - Logging verfeinern
   - Error handling

4. **Phase 4: UI Integration**
   - In Mission Control anzeigen: "Last sync: X minutes ago"
   - Manuelle Sync-Button (für Admins)

## Technische Details

### MD5 Hash Berechnung
```typescript
import crypto from 'crypto';
const hash = crypto.createHash('md5').update(content).digest('hex');
```

### Batch Uploads
- Convex hat Limits: Max ~1000 Objekte pro Mutation
- Files in Batches von 100 verarbeiten

### Fehlerbehandlung
- Retry mit Exponential Backoff (3 Versuche)
- Bei Persistenz-Fehler: Alert an Jörg

### Performance
- Nur geänderte Dateien (hash-Vergleich)
- Ignorieren: `node_modules/`, `.git/`, `out/`, `.next/`

## Testing

1. Einzelnes File manuell syncen
2. Batch von 10 Files
3. Vollständiger Workspace-Scan
4. Cron-Job Sync
5. Automatisierter Lauf über 24h beobachten

## Sub-Agenten Plan

**Agent 1: File Sync Implementation**
- Bau `scripts/sync-files.ts`
- Erweitere Convex mutations
- Test mit 5 Beispiel-Files

**Agent 2: Cron Sync Implementation**
- Bau `scripts/sync-cron.ts`
- Erweitere tasks.ts
- Test mit bestehenden Cron-Jobs

**Agent 3: Automation & Integration**
- Erstelle Cron-Job für regelmäßigen Sync
- Baue Logging
- Füge "Last sync" Anzeige zu Mission Control hinzu

**Agent 4: Error Handling & Polish**
- Retry-Logik
- Error Alerts
- Performance-Optimierung
- Dokumentation

## Erfolgskriterien

- [ ] Alle Markdown-Files in Convex verfügbar
- [ ] Cron-Jobs erscheinen im Calendar
- [ ] Änderungen innerhalb von 4h sichtbar
- [ ] Keine Duplikate
- [ ] Zuverlässiges Error-Handling
- [ ] Jörg bekommt keine False-Alarms

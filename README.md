# Mission Control Dashboard

Ein Dashboard zur Verwaltung von Aktivitäten, Tasks und globaler Suche – gebaut mit NextJS, Convex und TailwindCSS.

## Features

### 1. Activity Feed
- Zeichnet JEDE Aktion auf
- Filterbar nach Aktionstyp und Suchbegriff
- Chronologische Liste mit Pagination
- Live-Updates via Convex Realtime

### 2. Calendar View (Weekly)
- Wochenansicht aller geplanten Tasks
- Farbcodierung nach Typ (Reminder, Task, Event)
- Navigation: Vorherige/Nächste Woche, Heute
- Übersichtliche Darstellung

### 3. Global Search
- Durchsucht: Memory-Dateien, Dokumente, Tasks, Aktivitäten
- Gruppierte Suchergebnisse
- Highlighting der Suchbegriffe
- Schnellzugriff auf Details

## Tech Stack

- **NextJS 15** - React Framework mit App Router
- **Convex** - Backend-as-a-Service (Datenbank + Realtime)
- **TailwindCSS** - Utility-first CSS
- **TypeScript** - Type Safety
- **Lucide Icons** - Icon Library
- **date-fns** - Datumsformatierung
- **shadcn/ui** - UI Komponenten

## Installation

```bash
# Dependencies installieren
npm install

# Convex einrichten
npx convex dev

# Development Server starten
npm run dev
```

## Umgebungsvariablen

Erstelle eine `.env.local` Datei:

```env
NEXT_PUBLIC_CONVEX_URL=deine-convex-url
```

Die URL wird bei `npx convex dev` automatisch generiert.

## Projektstruktur

```
/apps/mission-control/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Dashboard Hauptseite
│   ├── layout.tsx           # Root Layout
│   └── ConvexClientProvider.tsx
├── components/              # React Komponenten
│   ├── ActivityFeed.tsx
│   ├── CalendarView.tsx
│   ├── GlobalSearch.tsx
│   └── ui/                  # shadcn/ui Komponenten
├── convex/                  # Convex Backend
│   ├── schema.ts           # Datenbank Schema
│   ├── activities.ts       # Activity API
│   ├── tasks.ts            # Task API
│   └── search.ts           # Search API
└── lib/
    └── utils.ts
```

## Datenbank Schema

### Activities
- `timestamp`: number
- `actionType`: string
- `details`: string
- `result`: string
- `metadata`: optional object
- `userId`: optional string

### Tasks
- `title`: string
- `description`: optional string
- `type`: "reminder" | "task" | "event"
- `scheduledAt`: number
- `status`: "pending" | "completed" | "cancelled"
- `recurrence`: optional string (cron)
- `priority`: optional "low" | "medium" | "high"

### Documents
- `title`: string
- `content`: string
- `category`: "memory" | "document" | "note"
- `createdAt`: number
- `updatedAt`: number

## Entwicklung

### Convex Codegenerierung
Nach Änderungen am Schema oder an den Query/Mutation Funktionen:

```bash
npx convex codegen
```

### Seed Daten

Testdaten können über die Seed-Funktionen in `src/lib/seed.ts` generiert werden.

## Deployment

### Convex Deploy
```bash
npx convex deploy
```

### NextJS Deploy (Vercel)
```bash
vercel --prod
```

## Lizenz

MIT

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  FileText,
  Activity,
  CheckSquare,
  Clock,
  ExternalLink,
  FolderOpen,
  Copy,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const categoryIcons: Record<string, React.ReactNode> = {
  activity: <Activity className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  task: <CheckSquare className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  activity: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  document: "bg-green-500/10 text-green-500 border-green-500/20",
  task: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

function highlightText(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-yellow-500/30 text-yellow-900 dark:text-yellow-100 px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function GlobalSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleItemClick = (item: any, type: string) => {
    setSelectedItem(item);
    setSelectedType(type);
  };

  const handleCopy = async () => {
    const text = selectedType === "activity" ? selectedItem.details :
                 selectedType === "document" ? selectedItem.content :
                 selectedItem.description || selectedItem.title;
    await navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Use real Convex query
  const searchResults = useQuery(api.search.globalSearch, 
    searchQuery.length >= 2 ? { query: searchQuery } : "skip"
  );

  const filteredResults = {
    activities:
      activeTab === "all" || activeTab === "activities"
        ? searchResults?.activities ?? []
        : [],
    documents:
      activeTab === "all" || activeTab === "documents"
        ? searchResults?.documents ?? []
        : [],
    tasks:
      activeTab === "all" || activeTab === "tasks"
        ? searchResults?.tasks ?? []
        : [],
  };

  const totalCount =
    (searchResults?.activities?.length ?? 0) +
    (searchResults?.documents?.length ?? 0) +
    (searchResults?.tasks?.length ?? 0);

  const ResultCard = ({
    item,
    type,
  }: {
    item: any;
    type: "activity" | "document" | "task";
  }) => {
    const Icon = categoryIcons[type];
    const colorClass = categoryColors[type];

    return (
      <div
        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
        onClick={() => handleItemClick(item, type)}
      >
        <div className={`p-2 rounded-md ${colorClass}`}>{Icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs capitalize">
              {type}
            </Badge>
            {(item.timestamp || item.scheduledAt || item.createdAt) && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(item.timestamp || item.scheduledAt || item.createdAt, "dd.MM.yyyy HH:mm", {
                  locale: de,
                })}
              </span>
            )}
          </div>
          <p className="text-sm font-medium mt-1 truncate">
            {type === "activity" && highlightText(item.details, searchQuery)}
            {type === "document" && highlightText(item.title, searchQuery)}
            {type === "task" && highlightText(item.title, searchQuery)}
          </p>
          {type === "task" && item.description && (
            <p className="text-xs text-muted-foreground truncate mt-1">
              {highlightText(item.description, searchQuery)}
            </p>
          )}
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Globale Suche
        </CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suche nach Aktivitäten, Dokumenten, Tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {searchQuery.length < 2 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Mindestens 2 Zeichen eingeben zum Suchen</p>
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Keine Ergebnisse für "{searchQuery}" gefunden</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Alle ({totalCount})
              </TabsTrigger>
              <TabsTrigger value="activities">
                Aktivitäten ({searchResults?.activities?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="documents">
                Dokumente ({searchResults?.documents?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="tasks">
                Tasks ({searchResults?.tasks?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-3">
              {filteredResults.activities.map((item: any) => (
                <ResultCard key={item._id} item={item} type="activity" />
              ))}
              {filteredResults.documents.map((item: any) => (
                <ResultCard key={item._id} item={item} type="document" />
              ))}
              {filteredResults.tasks.map((item: any) => (
                <ResultCard key={item._id} item={item} type="task" />
              ))}
            </TabsContent>

            <TabsContent value="activities" className="mt-4 space-y-3">
              {filteredResults.activities.map((item: any) => (
                <ResultCard key={item._id} item={item} type="activity" />
              ))}
            </TabsContent>

            <TabsContent value="documents" className="mt-4 space-y-3">
              {filteredResults.documents.map((item: any) => (
                <ResultCard key={item._id} item={item} type="document" />
              ))}
            </TabsContent>

            <TabsContent value="tasks" className="mt-4 space-y-3">
              {filteredResults.tasks.map((item: any) => (
                <ResultCard key={item._id} item={item} type="task" />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                {selectedType === "document" && <FileText className="h-5 w-5" />}
                {selectedType === "activity" && <Activity className="h-5 w-5" />}
                {selectedType === "task" && <CheckSquare className="h-5 w-5" />}
                {selectedType === "document" ? selectedItem?.title :
                 selectedType === "activity" ? selectedItem?.actionType :
                 selectedItem?.title}
              </DialogTitle>
            </div>
            {selectedItem && (
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <Badge variant="outline" className="text-xs capitalize">{selectedType}</Badge>
                {selectedType === "document" && selectedItem.category && (
                  <Badge variant="secondary" className="text-xs">{selectedItem.category}</Badge>
                )}
                {selectedType === "document" && selectedItem.path && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <FolderOpen className="h-3 w-3" />
                    {selectedItem.path}
                  </span>
                )}
                {(selectedItem.timestamp || selectedItem.createdAt || selectedItem.scheduledAt) && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(selectedItem.timestamp || selectedItem.createdAt || selectedItem.scheduledAt, "dd.MM.yyyy HH:mm", { locale: de })}
                  </span>
                )}
                <button
                  onClick={handleCopy}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Kopiert!" : "Kopieren"}
                </button>
              </div>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-auto mt-2 rounded-lg bg-muted/50 p-4">
            <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
              {selectedType === "activity" && selectedItem?.details}
              {selectedType === "document" && selectedItem?.content}
              {selectedType === "task" && (selectedItem?.description || selectedItem?.title)}
            </pre>
          </div>
          {selectedType === "document" && selectedItem?.size && (
            <div className="text-xs text-muted-foreground mt-2">
              {(selectedItem.size / 1024).toFixed(1)} KB
              {selectedItem.updatedAt && ` · Aktualisiert: ${format(selectedItem.updatedAt, "dd.MM.yyyy HH:mm", { locale: de })}`}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

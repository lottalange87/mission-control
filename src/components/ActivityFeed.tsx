"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  MessageSquare,
  Terminal,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const actionTypeIcons: Record<string, React.ReactNode> = {
  file_read: <FileText className="h-4 w-4" />,
  message_sent: <MessageSquare className="h-4 w-4" />,
  command_executed: <Terminal className="h-4 w-4" />,
  task_created: <CheckCircle className="h-4 w-4" />,
  default: <Activity className="h-4 w-4" />,
};

const actionTypeColors: Record<string, string> = {
  file_read: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  message_sent: "bg-green-500/10 text-green-500 border-green-500/20",
  command_executed: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  task_created: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  default: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export function ActivityFeed() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionType, setActionType] = useState<string>("all");
  const [limit, setLimit] = useState(20);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  // Use real Convex queries
  const activities = useQuery(api.activities.getActivities, {
    limit,
    searchQuery: searchQuery || undefined,
    actionType: actionType !== "all" ? actionType : undefined,
  });
  const actionTypes = useQuery(api.activities.getActionTypes);

  const getResultIcon = (result: string) => {
    if (result.toLowerCase().includes("success") || result.toLowerCase().includes("ok")) {
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    }
    if (result.toLowerCase().includes("error") || result.toLowerCase().includes("fail")) {
      return <XCircle className="h-3 w-3 text-red-500" />;
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suche in Aktivitäten..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={actionType} onValueChange={setActionType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Aktionstyp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              {actionTypes?.map((type: string) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-3">
          {activities?.map((activity) => (
            <div
              key={activity._id}
              onClick={() => setSelectedActivity(activity)}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div
                className={`p-2 rounded-md ${
                  actionTypeColors[activity.actionType] || actionTypeColors.default
                }`}
              >
                {actionTypeIcons[activity.actionType] || actionTypeIcons.default}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {activity.actionType}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(activity.timestamp, "dd.MM.yyyy HH:mm", { locale: de })}
                  </span>
                </div>
                <p className="text-sm mt-1 font-medium truncate">{activity.details}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getResultIcon(activity.result)}
                  <span className="text-xs text-muted-foreground">{activity.result}</span>
                </div>
              </div>
            </div>
          ))}
          {activities?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Keine Aktivitäten gefunden
            </div>
          )}
        </div>
        {activities && activities.length >= limit && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => setLimit((prev) => prev + 20)}
          >
            Mehr laden
          </Button>
        )}

        {/* Activity Detail Dialog */}
        <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Aktivitätsdetails
              </DialogTitle>
              <DialogDescription>
                Vollständige Informationen zu dieser Aktivität
              </DialogDescription>
            </DialogHeader>
            {selectedActivity && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedActivity.actionType}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(selectedActivity.timestamp, "dd.MM.yyyy HH:mm:ss", { locale: de })}
                  </span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedActivity.details}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Ergebnis:</span>
                  {getResultIcon(selectedActivity.result)}
                  <span className="text-sm">{selectedActivity.result}</span>
                </div>
                {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Metadaten:</span>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(selectedActivity.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Bell,
  CheckSquare,
  CalendarDays,
} from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  isSameDay,
  eachDayOfInterval,
} from "date-fns";
import { de } from "date-fns/locale";

const typeIcons = {
  reminder: Bell,
  task: CheckSquare,
  event: CalendarDays,
};

const typeColors = {
  reminder: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  task: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  event: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const typeBadgeColors = {
  reminder: "bg-yellow-500 text-yellow-950",
  task: "bg-blue-500 text-blue-950",
  event: "bg-purple-500 text-purple-950",
};

const priorityColors: Record<string, string> = {
  low: "bg-green-500/10 text-green-600",
  medium: "bg-orange-500/10 text-orange-600",
  high: "bg-red-500/10 text-red-600",
};

export function CalendarView() {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = useMemo(() => startOfWeek(currentWeek, { locale: de }), [currentWeek]);
  const weekEnd = useMemo(() => endOfWeek(currentWeek, { locale: de }), [currentWeek]);

  // Use real Convex query
  const tasks = useQuery(api.tasks.getTasksForWeek, {
    weekStart: weekStart.getTime(),
    weekEnd: weekEnd.getTime(),
  });

  const weekDays = useMemo(() => {
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [weekStart, weekEnd]);

  const goToToday = () => setCurrentWeek(new Date());
  const goToPreviousWeek = () => setCurrentWeek((prev) => subWeeks(prev, 1));
  const goToNextWeek = () => setCurrentWeek((prev) => addWeeks(prev, 1));

  const getTasksForDay = (day: Date) => {
    return tasks?.filter((task) => isSameDay(new Date(task.scheduledAt), day)) ?? [];
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Wochenansicht
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Heute
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {format(weekStart, "dd. MMMM", { locale: de })} -{" "}
          {format(weekEnd, "dd. MMMM yyyy", { locale: de })}
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 gap-2 min-w-[600px]">
          {weekDays.map((day) => {
            const dayTasks = getTasksForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] p-2 rounded-lg border ${
                  isToday ? "bg-accent border-primary" : "bg-card"
                }`}
              >
                <div className="text-center mb-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {format(day, "EEE", { locale: de })}
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      isToday ? "text-primary" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </p>
                </div>
                <div className="space-y-1">
                  {dayTasks.map((task) => {
                    const TypeIcon = typeIcons[task.type as keyof typeof typeIcons];
                    return (
                      <div
                        key={task._id}
                        className={`p-2 rounded-md text-xs border ${typeColors[task.type as keyof typeof typeColors]}`}
                      >
                        <div className="flex items-center gap-1">
                          <TypeIcon className="h-3 w-3" />
                          <span className="font-medium truncate">{task.title}</span>
                        </div>
                        {task.priority && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] mt-1 ${priorityColors[task.priority] || ""}`}
                          >
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-medium">Legende</h4>
          <div className="flex gap-4 flex-wrap">
            {(
              [
                ["reminder", "Erinnerung"],
                ["task", "Task"],
                ["event", "Event"],
              ] as const
            ).map(([type, label]) => {
              const TypeIcon = typeIcons[type];
              return (
                <div key={type} className="flex items-center gap-2">
                  <div className={`p-1 rounded ${typeBadgeColors[type]}`}>
                    <TypeIcon className="h-3 w-3" />
                  </div>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

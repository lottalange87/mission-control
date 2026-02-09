"use client";

import { ActivityFeed } from "@/components/ActivityFeed";
import { CalendarView } from "@/components/CalendarView";
import { GlobalSearch } from "@/components/GlobalSearch";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rocket, Activity, Calendar, Search } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Rocket className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Mission Control <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-2">v1.0</span></h1>
                <p className="text-sm text-muted-foreground">
                  Lotta's Activity Dashboard 🚀
                </p>
              </div>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Desktop View - Side by Side */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          <div className="h-[calc(100vh-180px)]">
            <ActivityFeed />
          </div>
          <div className="h-[calc(100vh-180px)]">
            <CalendarView />
          </div>
          <div className="h-[calc(100vh-180px)]">
            <GlobalSearch />
          </div>
        </div>

        {/* Mobile View - Tabs */}
        <div className="lg:hidden">
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Feed</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Kalender</span>
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Suche</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="mt-4">
              <div className="h-[calc(100vh-220px)]">
                <ActivityFeed />
              </div>
            </TabsContent>
            <TabsContent value="calendar" className="mt-4">
              <div className="h-[calc(100vh-220px)]">
                <CalendarView />
              </div>
            </TabsContent>
            <TabsContent value="search" className="mt-4">
              <div className="h-[calc(100vh-220px)]">
                <GlobalSearch />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

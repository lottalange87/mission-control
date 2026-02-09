"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

export function DarkModeToggle() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleDarkMode}
      title={darkMode ? "Hellmodus" : "Dunkelmodus"}
    >
      {darkMode ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}

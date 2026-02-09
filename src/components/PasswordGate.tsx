"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Rocket, Lock } from "lucide-react";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin";
const SESSION_KEY = "mcd_authenticated";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === "true") {
      setAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword("");
    }
  };

  if (loading) return null;

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto p-3 bg-primary rounded-lg w-fit mb-2">
            <Rocket className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Mission Control</CardTitle>
          <p className="text-sm text-muted-foreground">Passwort eingeben um fortzufahren</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Passwort"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                className="pl-9"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">Falsches Passwort</p>
            )}
            <Button type="submit" className="w-full">
              Anmelden
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

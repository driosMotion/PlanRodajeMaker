"use client";

import * as React from "react";
import { ScriptEditor } from "@/components/script-editor";
import { ProjectData } from "@/lib/types";
import { DEFAULT_COLUMNS } from "@/lib/default-columns";

const STORAGE_KEY = "script-studio-project";

function loadFromStorage(): ProjectData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProjectData;
  } catch {
    return null;
  }
}

function saveToStorage(project: ProjectData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

function createDefaultProject(): ProjectData {
  return {
    name: "Untitled Project",
    columns: DEFAULT_COLUMNS,
    rows: [],
    language: "ENG",
    updatedAt: new Date().toLocaleString(),
  };
}

export default function Home() {
  const [project, setProject] = React.useState<ProjectData>(() => {
    return loadFromStorage() || createDefaultProject();
  });

  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load from storage on mount (client-side only)
  React.useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      setProject(saved);
    }
    setIsLoaded(true);
  }, []);

  // Debounced auto-save to localStorage on every change
  const lastSaved = React.useRef<string>("");
  React.useEffect(() => {
    if (!isLoaded) return;
    const json = JSON.stringify(project);
    if (json === lastSaved.current) return;
    lastSaved.current = json;
    const timer = setTimeout(() => {
      saveToStorage(project);
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [project, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="min-h-full flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-background text-foreground">
      <ScriptEditor project={project} onProjectChange={setProject} />
    </div>
  );
}

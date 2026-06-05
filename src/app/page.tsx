"use client";

import * as React from "react";
import { ScriptEditor } from "@/components/script-editor";
import { ProjectData } from "@/lib/types";
import { DEFAULT_COLUMNS } from "@/lib/default-columns";

const STORAGE_KEY = "script-studio-project";

function loadFromStorage(): ProjectData | null {
  try {
    if (typeof window === "undefined") return null;
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
    // Storage full — images too large. Silently skip to avoid disruption.
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
  const [ready, setReady] = React.useState(false);
  const [project, setProject] = React.useState<ProjectData>(createDefaultProject());

  // On mount (client only), restore from localStorage
  React.useEffect(() => {
    const saved = loadFromStorage();
    if (saved) setProject(saved);
    setReady(true);
  }, []);

  // Debounced auto-save to localStorage on every change
  const lastJson = React.useRef<string>("");
  React.useEffect(() => {
    if (!ready) return;
    const json = JSON.stringify(project);
    if (json === lastJson.current) return;
    lastJson.current = json;
    const timer = setTimeout(() => saveToStorage(project), 500);
    return () => clearTimeout(timer);
  }, [project, ready]);

  return (
    <div className="min-h-full flex flex-col bg-background text-foreground">
      <ScriptEditor project={project} onProjectChange={setProject} />
    </div>
  );
}

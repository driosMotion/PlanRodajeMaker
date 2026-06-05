"use client";

import * as React from "react";
import { ScriptEditor } from "@/components/script-editor";
import { ProjectData } from "@/lib/types";
import { DEFAULT_COLUMNS } from "@/lib/default-columns";
import { loadProject, saveProject } from "@/lib/storage";

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
  const [project, setProject] = React.useState<ProjectData>(createDefaultProject);

  // On mount, restore from IndexedDB
  React.useEffect(() => {
    loadProject<ProjectData>().then((saved) => {
      if (saved) setProject(saved);
      setReady(true);
    });
  }, []);

  // Debounced auto-save to IndexedDB on every change
  const lastJson = React.useRef<string>("");
  React.useEffect(() => {
    if (!ready) return;
    const json = JSON.stringify(project);
    if (json === lastJson.current) return;
    lastJson.current = json;
    const timer = setTimeout(() => {
      saveProject(project).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [project, ready]);

  return (
    <div className="min-h-full flex flex-col bg-background text-foreground">
      <ScriptEditor project={project} onProjectChange={setProject} />
    </div>
  );
}

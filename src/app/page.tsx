"use client";

import * as React from "react";
import { ScriptEditor } from "@/components/script-editor";
import { ProjectData } from "@/lib/types";
import { DEFAULT_COLUMNS } from "@/lib/default-columns";

export default function Home() {
  const [project, setProject] = React.useState<ProjectData>({
    name: "Untitled Project",
    columns: DEFAULT_COLUMNS,
    rows: [],
    language: "ENG",
    updatedAt: new Date().toLocaleString(),
  });

  return (
    <div className="min-h-full flex flex-col bg-background text-foreground">
      <ScriptEditor project={project} onProjectChange={setProject} />
    </div>
  );
}

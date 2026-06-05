"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  GripVertical,
  Plus,
  Trash2,
  Pencil,
  Columns3,
  ImagePlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ComboboxCell } from "./combobox-cell";
import { SortableRow } from "./sortable-row";
import { SortableHeader } from "./sortable-header";
import { ColumnDef, RowData, ProjectData, Language } from "@/lib/types";
import { DEFAULT_COLUMNS, generateId, createEmptyRow } from "@/lib/default-columns";
import {
  exportCSV,
  exportPDF,
  exportZIP,
  saveProject,
  loadProject,
} from "@/lib/export-utils";

interface ScriptEditorProps {
  project: ProjectData;
  onProjectChange: (project: ProjectData) => void;
}

export function ScriptEditor({ project, onProjectChange }: ScriptEditorProps) {
  const [activeRowId, setActiveRowId] = React.useState<string | null>(null);
  const [activeColId, setActiveColId] = React.useState<string | null>(null);
  const [addColumnOpen, setAddColumnOpen] = React.useState(false);
  const [editColumnOpen, setEditColumnOpen] = React.useState(false);
  const [editingColumn, setEditingColumn] = React.useState<ColumnDef | null>(null);
  const [projectMenuOpen, setProjectMenuOpen] = React.useState(false);
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState(project.name);
  const [newColumnName, setNewColumnName] = React.useState("");
  const [newColumnType, setNewColumnType] = React.useState<"text" | "select" | "textarea">("text");
  const [newColumnOptions, setNewColumnOptions] = React.useState("");
  const [editColumnName, setEditColumnName] = React.useState("");
  const [editColumnOptions, setEditColumnOptions] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const rowSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const colSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleRowDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = project.rows.findIndex((r) => r.id === active.id);
      const newIndex = project.rows.findIndex((r) => r.id === over.id);
      const newRows = arrayMove(project.rows, oldIndex, newIndex);
      onProjectChange({ ...project, rows: newRows, updatedAt: new Date().toLocaleString() });
    }
    setActiveRowId(null);
  };

  const handleColDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = project.columns.findIndex((c) => c.id === active.id);
      const newIndex = project.columns.findIndex((c) => c.id === over.id);
      const newCols = arrayMove(project.columns, oldIndex, newIndex);
      onProjectChange({ ...project, columns: newCols, updatedAt: new Date().toLocaleString() });
    }
    setActiveColId(null);
  };

  const addRow = () => {
    const newRow = createEmptyRow(project.columns);
    onProjectChange({
      ...project,
      rows: [...project.rows, newRow],
      updatedAt: new Date().toLocaleString(),
    });
  };

  const deleteRow = (rowId: string) => {
    onProjectChange({
      ...project,
      rows: project.rows.filter((r) => r.id !== rowId),
      updatedAt: new Date().toLocaleString(),
    });
  };

  const updateRowValue = (rowId: string, colId: string, value: string) => {
    onProjectChange({
      ...project,
      rows: project.rows.map((r) =>
        r.id === rowId
          ? { ...r, values: { ...r.values, [colId]: value } }
          : r
      ),
      updatedAt: new Date().toLocaleString(),
    });
  };

  const updateRowImage = (rowId: string, colId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onProjectChange({
        ...project,
        rows: project.rows.map((r) =>
          r.id === rowId
            ? {
                ...r,
                imageData: { ...r.imageData, [colId]: dataUrl },
                imageNames: { ...r.imageNames, [colId]: file.name },
              }
            : r
        ),
        updatedAt: new Date().toLocaleString(),
      });
    };
    reader.readAsDataURL(file);
  };

  const removeRowImage = (rowId: string, colId: string) => {
    onProjectChange({
      ...project,
      rows: project.rows.map((r) => {
        if (r.id !== rowId) return r;
        const { [colId]: _, ...restData } = r.imageData || {};
        const { [colId]: __, ...restNames } = r.imageNames || {};
        return { ...r, imageData: restData, imageNames: restNames };
      }),
      updatedAt: new Date().toLocaleString(),
    });
  };

  const addColumn = () => {
    if (!newColumnName.trim()) return;
    const colId = generateId();
    const newCol: ColumnDef = {
      id: colId,
      name: newColumnName.trim(),
      type: newColumnType,
      minWidth: newColumnType === "textarea" ? 180 : newColumnType === "select" ? 120 : 100,
    };
    if (newColumnType === "select" && newColumnOptions.trim()) {
      newCol.options = newColumnOptions
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => {
          const [value, ...labelParts] = l.split("|");
          return { value: value.trim(), label: labelParts.join("|").trim() || value.trim() };
        });
    }
    const newRows = project.rows.map((r) => ({
      ...r,
      values: { ...r.values, [colId]: "" },
    }));
    onProjectChange({
      ...project,
      columns: [...project.columns, newCol],
      rows: newRows,
      updatedAt: new Date().toLocaleString(),
    });
    setNewColumnName("");
    setNewColumnType("text");
    setNewColumnOptions("");
    setAddColumnOpen(false);
  };

  const deleteColumn = (colId: string) => {
    const newRows = project.rows.map((r) => {
      const { [colId]: _, ...restValues } = r.values;
      const { [colId]: __, ...restData } = r.imageData || {};
      const { [colId]: ___, ...restNames } = r.imageNames || {};
      return { ...r, values: restValues, imageData: restData, imageNames: restNames };
    });
    onProjectChange({
      ...project,
      columns: project.columns.filter((c) => c.id !== colId),
      rows: newRows,
      updatedAt: new Date().toLocaleString(),
    });
  };

  const openEditColumn = (col: ColumnDef) => {
    setEditingColumn(col);
    setEditColumnName(col.name);
    setEditColumnOptions(
      col.options?.map((o) => (o.label !== o.value ? `${o.value}|${o.label}` : o.value)).join("\n") || ""
    );
    setEditColumnOpen(true);
  };

  const saveEditColumn = () => {
    if (!editingColumn || !editColumnName.trim()) return;
    const updatedCol: ColumnDef = {
      ...editingColumn,
      name: editColumnName.trim(),
    };
    if (updatedCol.type === "select") {
      updatedCol.options = editColumnOptions
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => {
          const [value, ...labelParts] = l.split("|");
          return { value: value.trim(), label: labelParts.join("|").trim() || value.trim() };
        });
    }
    onProjectChange({
      ...project,
      columns: project.columns.map((c) => (c.id === editingColumn.id ? updatedCol : c)),
      updatedAt: new Date().toLocaleString(),
    });
    setEditColumnOpen(false);
    setEditingColumn(null);
  };

  const handleExportCSV = () => exportCSV(project);
  const handleExportPDF = () => exportPDF(project);
  const handleExportZIP = () => exportZIP(project);
  const handleSave = () => saveProject(project);

  const handleLoad = () => {
    fileInputRef.current?.click();
  };

  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await loadProject(file);
      onProjectChange(data);
    } catch (err) {
      alert("Failed to load project file");
    }
    e.target.value = "";
  };

  const handleNewProject = () => {
    if (confirm("Create a new project? Unsaved changes will be lost.")) {
      onProjectChange({
        name: "Untitled Project",
        columns: DEFAULT_COLUMNS,
        rows: [],
        language: "ENG",
        updatedAt: new Date().toLocaleString(),
      });
    }
  };

  const handleRename = () => {
    if (newProjectName.trim()) {
      onProjectChange({ ...project, name: newProjectName.trim() });
      setRenameOpen(false);
    }
  };

  const toggleLanguage = () => {
    const newLang: Language = project.language === "ENG" ? "ESP" : "ENG";
    onProjectChange({ ...project, language: newLang });
  };

  const textColumns = project.columns.filter((c) => c.type !== "image");
  const imageColumns = project.columns.filter((c) => c.type === "image");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center gap-3 flex-wrap">
        <h1 className="text-lg font-semibold text-foreground">Script Studio</h1>
        <p className="text-xs text-muted-foreground hidden sm:block">Technical Script Editor</p>

        <div className="flex-1" />

        {/* Project Menu */}
        <DropdownMenu open={projectMenuOpen} onOpenChange={setProjectMenuOpen}>
          <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3">
            {project.name}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={handleNewProject}>New Project</DropdownMenuItem>
            <DropdownMenuItem onClick={handleLoad}>Load Project</DropdownMenuItem>
            <DropdownMenuItem onClick={handleSave}>Save Project</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setRenameOpen(true); setNewProjectName(project.name); setProjectMenuOpen(false); }}>
              Rename Project
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-muted-foreground">
              Export
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCSV} className="pl-6 text-xs">
              CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF} className="pl-6 text-xs">
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportZIP} className="pl-6 text-xs">
              ZIP
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="min-w-[48px]"
        >
          {project.language}
        </Button>

        {/* Quick Export buttons */}
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          Export PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportZIP}>
          Export ZIP
        </Button>

        {/* Load */}
        <Button variant="outline" size="sm" onClick={handleLoad}>
          Load
        </Button>

        {/* Save */}
        <Button variant="outline" size="sm" onClick={handleSave}>
          Save
        </Button>
      </header>

      {/* Main table area */}
      <div className="flex-1 overflow-auto border border-border rounded-lg mx-4 my-4">
        <table className="w-full border-collapse">
          {/* Column Headers */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-secondary">
              <th className="p-2 w-12 bg-secondary">
                <Columns3 className="h-4 w-4 text-muted-foreground mx-auto" />
              </th>
              <DndContext
                sensors={colSensors}
                collisionDetection={closestCenter}
                onDragStart={(e) => setActiveColId(e.active.id as string)}
                onDragEnd={handleColDragEnd}
              >
                <SortableContext
                  items={project.columns.map((c) => c.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {project.columns.map((col) => (
                    <SortableHeader
                      key={col.id}
                      column={col}
                      onEdit={() => openEditColumn(col)}
                      onDelete={() => deleteColumn(col.id)}
                      isActive={activeColId === col.id}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {/* Add Column Button */}
              <th className="p-2 w-16 bg-secondary">
                <Dialog open={addColumnOpen} onOpenChange={setAddColumnOpen}>
                  <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md has-[>svg]:px-2.5 h-7 px-2 text-xs gap-1 border bg-background shadow-xs dark:bg-input/30 dark:border-input">
                      <Plus className="h-3 w-3" />
                      <Columns3 className="h-3 w-3" />
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Column</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="col-name">Column Name</Label>
                        <Input
                          id="col-name"
                          value={newColumnName}
                          onChange={(e) => setNewColumnName(e.target.value)}
                          placeholder="e.g. Action"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="col-type">Type</Label>
                        <select
                          id="col-type"
                          value={newColumnType}
                          onChange={(e) =>
                            setNewColumnType(e.target.value as "text" | "select" | "textarea")
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        >
                          <option value="text">Text</option>
                          <option value="select">Select (Dropdown)</option>
                          <option value="textarea">Text Area</option>
                          <option value="image" disabled>Image (Still Ref)</option>
                        </select>
                      </div>
                      {newColumnType === "select" && (
                        <div className="grid gap-2">
                          <Label htmlFor="col-options">
                            Options (one per line, format: value|Label or just value)
                          </Label>
                          <Textarea
                            id="col-options"
                            value={newColumnOptions}
                            onChange={(e) => setNewColumnOptions(e.target.value)}
                            placeholder={`option1|Option 1\noption2|Option 2\noption3`}
                            rows={5}
                          />
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddColumnOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addColumn}>Add</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </th>
            </tr>
          </thead>

          {/* Rows */}
          <DndContext
            sensors={rowSensors}
            collisionDetection={closestCenter}
            onDragStart={(e) => setActiveRowId(e.active.id as string)}
            onDragEnd={handleRowDragEnd}
          >
            <SortableContext
              items={project.rows.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody>
                {project.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={project.columns.length + 2}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No rows yet. Click "Add Row" to start.
                    </td>
                  </tr>
                ) : (
                  project.rows.map((row, rowIdx) => (
                    <SortableRow
                      key={row.id}
                      row={row}
                      rowIndex={rowIdx}
                      columns={project.columns}
                      isActive={activeRowId === row.id}
                      onUpdateValue={(colId, value) =>
                        updateRowValue(row.id, colId, value)
                      }
                      onDelete={() => deleteRow(row.id)}
                      onImageUpload={(colId, file) =>
                        updateRowImage(row.id, colId, file)
                      }
                      onImageRemove={(colId) =>
                        removeRowImage(row.id, colId)
                      }
                    />
                  ))
                )}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
      </div>

      {/* Add Row Button */}
      <div className="flex justify-center pb-4">
        <Button variant="outline" size="sm" onClick={addRow} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Row
        </Button>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-6 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            {project.rows.length} row{project.rows.length !== 1 ? "s" : ""} &bull;{" "}
            {project.columns.length} columns
          </div>
          <div>Last updated: {project.updatedAt}</div>
        </div>
      </footer>

      {/* Edit Column Dialog */}
      <Dialog open={editColumnOpen} onOpenChange={setEditColumnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Column: {editingColumn?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-col-name">Column Name</Label>
              <Input
                id="edit-col-name"
                value={editColumnName}
                onChange={(e) => setEditColumnName(e.target.value)}
              />
            </div>
            {editingColumn?.type === "select" && (
              <div className="grid gap-2">
                <Label htmlFor="edit-col-options">
                  Options (one per line, format: value|Label or just value)
                </Label>
                <Textarea
                  id="edit-col-options"
                  value={editColumnOptions}
                  onChange={(e) => setEditColumnOptions(e.target.value)}
                  rows={5}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditColumnOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditColumn}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden file input for Load */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileLoad}
      />
    </div>
  );
}

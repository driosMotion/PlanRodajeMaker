"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ComboboxCell } from "./combobox-cell";
import { ColumnDef, RowData } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SortableRowProps {
  row: RowData;
  rowIndex: number;
  columns: ColumnDef[];
  isActive: boolean;
  onUpdateValue: (colId: string, value: string) => void;
  onDelete: () => void;
  onImageUpload: (colId: string, file: File) => void;
  onImageRemove: (colId: string) => void;
}

export function SortableRow({
  row,
  rowIndex,
  columns,
  isActive,
  onUpdateValue,
  onDelete,
  onImageUpload,
  onImageRemove,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const imageInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/30",
        isActive && "z-10 shadow-md"
      )}
    >
      {/* Row Number + Drag Handle */}
      <td className="p-2 w-12">
        <div className="flex items-center gap-1">
          <button
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted text-muted-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground w-6 text-center">
            {rowIndex + 1}
          </span>
        </div>
      </td>

      {/* Cells */}
      {columns.map((col) => (
        <td
          key={col.id}
          className="p-1"
          style={{ minWidth: col.minWidth || 100 }}
        >
          {col.type === "text" && (
            <Input
              placeholder={col.name}
              value={row.values[col.id] || ""}
              onChange={(e) => onUpdateValue(col.id, e.target.value)}
              className="text-sm h-9 bg-input border-border"
            />
          )}

          {col.type === "select" && (
            <ComboboxCell
              column={col}
              value={row.values[col.id] || ""}
              onChange={(value) => onUpdateValue(col.id, value)}
              placeholder={col.name}
            />
          )}

          {col.type === "textarea" && (
            <Textarea
              placeholder={col.name}
              value={row.values[col.id] || ""}
              onChange={(e) => onUpdateValue(col.id, e.target.value)}
              className="text-sm min-h-[56px] resize-none bg-input border-border"
            />
          )}

          {col.type === "image" && (
            <div className="relative">
              {row.imageData?.[col.id] ? (
                <div className="relative group">
                  <img
                    src={row.imageData[col.id]}
                    alt="Still ref"
                    className="h-14 w-20 object-cover rounded-md border border-border"
                  />
                  <button
                    onClick={() => onImageRemove(col.id)}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="text-[10px] text-muted-foreground truncate block max-w-[80px] mt-0.5">
                    {row.imageNames?.[col.id] || "image"}
                  </span>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={(el) => { imageInputRefs.current[col.id] = el; }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onImageUpload(col.id, file);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRefs.current[col.id]?.click()}
                    className="h-14 w-20 flex flex-col gap-1"
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span className="text-[10px]">Add</span>
                  </Button>
                </>
              )}
            </div>
          )}
        </td>
      ))}

      {/* Delete Row Button */}
      <td className="p-2 w-12">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}

"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SortableHeaderProps {
  column: ColumnDef;
  onEdit: () => void;
  onDelete: () => void;
  isActive: boolean;
}

export function SortableHeader({
  column,
  onEdit,
  onDelete,
  isActive,
}: SortableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <th
      ref={setNodeRef}
      style={{
        ...style,
        minWidth: column.minWidth || 100,
      }}
      className={cn(
        "p-2 text-left font-medium text-sm bg-secondary",
        isActive && "z-10"
      )}
    >
      <div className="flex items-center gap-1 group">
        <button
          className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted text-muted-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </button>
        <span className="flex-1 truncate">{column.name}</span>
        <button
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-opacity"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-opacity"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </th>
  );
}

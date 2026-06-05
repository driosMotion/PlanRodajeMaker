"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { ColumnDef } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SortableHeaderProps {
  column: ColumnDef;
  onEdit: () => void;
  onDelete: () => void;
  onResize: (width: number) => void;
  isActive: boolean;
}

const MIN_COL_WIDTH = 60;

export function SortableHeader({
  column,
  onEdit,
  onDelete,
  onResize,
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

  const thRef = React.useRef<HTMLTableCellElement | null>(null);
  const isResizing = React.useRef(false);
  const startX = React.useRef(0);
  const startWidth = React.useRef(0);

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = thRef.current?.offsetWidth || column.minWidth || 100;

      const handleMouseMove = (ev: MouseEvent) => {
        if (!isResizing.current) return;
        const delta = ev.clientX - startX.current;
        const newWidth = Math.max(MIN_COL_WIDTH, startWidth.current + delta);
        if (thRef.current) {
          thRef.current.style.width = `${newWidth}px`;
          thRef.current.style.minWidth = `${newWidth}px`;
        }
      };

      const handleMouseUp = (ev: MouseEvent) => {
        if (!isResizing.current) return;
        isResizing.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        // Commit the final width
        const finalWidth = Math.max(
          MIN_COL_WIDTH,
          (thRef.current?.offsetWidth || startWidth.current)
        );
        onResize(finalWidth);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [column.minWidth, onResize]
  );

  return (
    <th
      ref={(el) => {
        setNodeRef(el);
        thRef.current = el;
      }}
      style={{
        ...style,
        minWidth: column.minWidth || 100,
        width: column.minWidth || 100,
        position: "relative",
      }}
      className={cn(
        "p-2 text-left font-medium text-sm bg-secondary select-none",
        isActive && "z-10"
      )}
    >
      <div className="flex items-center gap-1 group pr-1">
        <button
          className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted text-muted-foreground shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </button>
        <span className="flex-1 truncate text-xs">{column.name}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-opacity shrink-0"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-opacity shrink-0"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/40 active:bg-primary/60 z-20 rounded-sm"
        style={{ transform: "translateX(4px)" }}
      />
    </th>
  );
}

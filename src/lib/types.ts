export interface ColumnOption {
  value: string;
  label: string;
}

export interface ColumnDef {
  id: string;
  name: string;
  type: "text" | "select" | "image" | "textarea";
  options?: ColumnOption[];
  minWidth?: number;
}

export interface RowData {
  id: string;
  values: Record<string, string>;
  imageData?: Record<string, string>; // columnId -> base64 data URL
  imageNames?: Record<string, string>; // columnId -> original filename
}

export interface ProjectData {
  name: string;
  columns: ColumnDef[];
  rows: RowData[];
  language: "ENG" | "ESP";
  updatedAt: string;
}

export type Language = "ENG" | "ESP";

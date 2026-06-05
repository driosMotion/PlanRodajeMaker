import { ColumnDef, RowData } from "./types";

export const DEFAULT_COLUMNS: ColumnDef[] = [
  {
    id: "scene",
    name: "Scene",
    type: "text",
    minWidth: 80,
  },
  {
    id: "shot",
    name: "Shot",
    type: "select",
    options: [
      { value: "WS", label: "WS — Wide Shot" },
      { value: "MS", label: "MS — Medium Shot" },
      { value: "MCU", label: "MCU — Medium Close-Up" },
      { value: "CU", label: "CU — Close-Up" },
      { value: "ECU", label: "ECU — Extreme Close-Up" },
      { value: "ELS", label: "ELS — Extreme Long Shot" },
      { value: "LA", label: "LA — Low Angle" },
      { value: "HA", label: "HA — High Angle" },
      { value: "OS", label: "OS — Over-the-Shoulder" },
      { value: "POV", label: "POV — Point of View" },
    ],
    minWidth: 100,
  },
  {
    id: "lens",
    name: "Lens",
    type: "select",
    options: [
      { value: "14mm", label: "14mm" },
      { value: "18mm", label: "18mm" },
      { value: "21mm", label: "21mm" },
      { value: "24mm", label: "24mm" },
      { value: "28mm", label: "28mm" },
      { value: "35mm", label: "35mm" },
      { value: "50mm", label: "50mm" },
      { value: "85mm", label: "85mm" },
      { value: "100mm", label: "100mm" },
      { value: "135mm", label: "135mm" },
      { value: "200mm", label: "200mm" },
    ],
    minWidth: 100,
  },
  {
    id: "camera_movement",
    name: "Camera Movement",
    type: "select",
    options: [
      { value: "static", label: "Static" },
      { value: "pan_left", label: "Pan Left" },
      { value: "pan_right", label: "Pan Right" },
      { value: "tilt_up", label: "Tilt Up" },
      { value: "tilt_down", label: "Tilt Down" },
      { value: "dolly_in", label: "Dolly In" },
      { value: "dolly_out", label: "Dolly Out" },
      { value: "track_left", label: "Track Left" },
      { value: "track_right", label: "Track Right" },
      { value: "crane_up", label: "Crane Up" },
      { value: "crane_down", label: "Crane Down" },
      { value: "handheld", label: "Handheld" },
      { value: "steadicam", label: "Steadicam" },
      { value: "gimbal", label: "Gimbal" },
      { value: "zoom_in", label: "Zoom In" },
      { value: "zoom_out", label: "Zoom Out" },
    ],
    minWidth: 140,
  },
  {
    id: "camera_angle",
    name: "Camera Angle",
    type: "select",
    options: [
      { value: "eye_level", label: "Eye Level" },
      { value: "high_angle", label: "High Angle" },
      { value: "low_angle", label: "Low Angle" },
      { value: "bird_eye", label: "Bird's Eye" },
      { value: "worm_eye", label: "Worm's Eye" },
      { value: "dutch", label: "Dutch Angle" },
      { value: "overhead", label: "Overhead" },
      { value: "shoulder", label: "Shoulder Level" },
    ],
    minWidth: 130,
  },
  {
    id: "camera_height",
    name: "Camera Height",
    type: "select",
    options: [
      { value: "ground", label: "Ground Level" },
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
      { value: "overhead_crane", label: "Overhead / Crane" },
    ],
    minWidth: 130,
  },
  {
    id: "description",
    name: "Description",
    type: "textarea",
    minWidth: 200,
  },
  {
    id: "still_ref",
    name: "Still Ref",
    type: "image",
    minWidth: 120,
  },
  {
    id: "comments",
    name: "Comments",
    type: "textarea",
    minWidth: 180,
  },
];

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function createEmptyRow(columns: ColumnDef[]): RowData {
  const values: Record<string, string> = {};
  const imageData: Record<string, string> = {};
  const imageNames: Record<string, string> = {};
  for (const col of columns) {
    values[col.id] = "";
  }
  return { id: generateId(), values, imageData, imageNames };
}

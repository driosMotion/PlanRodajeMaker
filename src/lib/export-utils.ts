import { ProjectData, RowData, ColumnDef } from "./types";
import jsPDF from "jspdf";
import "jspdf-autotable";
import JSZip from "jszip";
import { saveAs } from "file-saver";

function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportCSV(project: ProjectData): void {
  const imageColumns = project.columns.filter((c) => c.type === "image");
  const textColumns = project.columns.filter((c) => c.type !== "image");

  const headers = textColumns.map((c) => c.name);
  const imageColIds = new Set(imageColumns.map((c) => c.id));

  const rows = project.rows.map((row) =>
    textColumns
      .map((col) => {
        let val = row.values[col.id] || "";
        if (imageColIds.has(col.id)) {
          // For image columns, use the filename or just "image"
          val = row.imageNames?.[col.id] || "";
        }
        return escapeCsvValue(val);
      })
      .join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${project.name.replace(/\s+/g, "_")}.csv`);
}

export function exportPDF(project: ProjectData): void {
  const doc = new jsPDF("landscape", "mm", "a4");

  doc.setFontSize(16);
  doc.text(project.name, 14, 20);
  doc.setFontSize(10);
  doc.text(`Language: ${project.language}`, 14, 28);
  doc.text(`Updated: ${project.updatedAt}`, 14, 34);

  const imageColumns = project.columns.filter((c) => c.type === "image");
  const textColumns = project.columns.filter(
    (c) => c.type !== "image" && c.type !== "textarea"
  );
  const textareaColumns = project.columns.filter((c) => c.type === "textarea");

  const headers = project.columns
    .filter((c) => c.type !== "image")
    .map((c) => c.name);

  const rows = project.rows.map((row) =>
    project.columns
      .filter((c) => c.type !== "image")
      .map((col) => {
        let val = row.values[col.id] || "";
        if (col.type === "textarea") {
          val = val.replace(/\n/g, " ");
        }
        return val;
      })
  );

  (doc as any).autoTable({
    head: [headers],
    body: rows,
    startY: 40,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [41, 41, 41], textColor: 255 },
    margin: { top: 40 },
  });

  doc.save(`${project.name.replace(/\s+/g, "_")}.pdf`);
}

export async function exportZIP(project: ProjectData): Promise<void> {
  const zip = new JSZip();

  // Add project JSON (without full image data for size)
  const exportData: ProjectData = {
    ...project,
    rows: project.rows.map((row) => ({
      ...row,
      imageData: row.imageData || {},
      imageNames: row.imageNames || {},
    })),
  };

  // Store images as files in the zip
  const imagesFolder = zip.folder("images");
  const imageIndex: Record<string, string> = {};

  for (const [rowIdx, row] of project.rows.entries()) {
    if (row.imageData) {
      for (const colId of Object.keys(row.imageData)) {
        const dataUrl = row.imageData[colId];
        const fileName = row.imageNames?.[colId] || `image_${rowIdx}_${colId}`;
        const ext = fileName.includes(".")
          ? fileName.split(".").pop()
          : "png";
        const safeName = `${rowIdx}_${colId}.${ext}`;

        // Convert base64 to blob
        const byteString = atob(dataUrl.split(",")[1]);
        const mimeType = dataUrl.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeType });

        imagesFolder?.file(safeName, blob);
        imageIndex[`${rowIdx}_${colId}`] = safeName;
      }
    }
  }

  // Clean image data from JSON for the zip (keep filenames only)
  const cleanData: ProjectData = {
    ...project,
    rows: project.rows.map((row) => ({
      ...row,
      imageData: undefined,
      imageNames: row.imageNames || {},
    })),
  };

  zip.file("project.json", JSON.stringify(cleanData, null, 2));
  zip.file("image_index.json", JSON.stringify(imageIndex, null, 2));

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${project.name.replace(/\s+/g, "_")}.zip`);
}

export function saveProject(project: ProjectData): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  saveAs(blob, `${project.name.replace(/\s+/g, "_")}.json`);
}

export function loadProject(
  file: File
): Promise<ProjectData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ProjectData;
        resolve(data);
      } catch (err) {
        reject(new Error("Invalid project file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

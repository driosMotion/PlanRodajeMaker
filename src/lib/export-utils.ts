import { ProjectData } from "./types";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
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
  try {
    const doc = new jsPDF("landscape", "mm", "a4");

    doc.setFontSize(16);
    doc.text(project.name, 14, 20);
    doc.setFontSize(10);
    doc.text(`Language: ${project.language}`, 14, 28);
    doc.text(`Updated: ${project.updatedAt}`, 14, 34);

    // Include all columns — image columns will show thumbnails
    const allColumns = project.columns;
    const imageColumnIndices: number[] = [];

    const headers = allColumns.map((c, i) => {
      if (c.type === "image") imageColumnIndices.push(i);
      return c.name;
    });

    const rows = project.rows.map((row) =>
      allColumns.map((col) => {
        if (col.type === "image") return row.imageNames?.[col.id] || "";
        if (col.type === "textarea")
          return (row.values[col.id] || "").replace(/\n/g, " ");
        return row.values[col.id] || "";
      })
    );

    // Build columnStyles to give image columns a fixed height
    const columnStyles: Record<string, any> = {};
    imageColumnIndices.forEach((idx) => {
      columnStyles[idx] = { cellWidth: 22, minCellHeight: 16 };
    });

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 40,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [41, 41, 41], textColor: 255 },
      columnStyles,
      margin: { top: 40 },
      didDrawCell: (data: any) => {
        if (
          data.section === "body" &&
          imageColumnIndices.includes(data.column.index)
        ) {
          const rowIdx = data.row.index;
          const colId = allColumns[data.column.index].id;
          const rowData = project.rows[rowIdx];
          const imgData = rowData?.imageData?.[colId];
          if (!imgData) return;

          const cell = data.cell;
          const pad = 1;
          const cw = cell.width - pad * 2;
          const ch = cell.height - pad * 2;
          if (cw <= 0 || ch <= 0) return;

          try {
            // Detect format from the data URL
            const format = imgData.startsWith("data:image/png")
              ? "PNG"
              : imgData.startsWith("data:image/jpeg") ||
                imgData.startsWith("data:image/jpg")
              ? "JPEG"
              : "PNG";
            doc.addImage(
              imgData,
              format,
              cell.x + pad,
              cell.y + pad,
              cw,
              ch
            );
          } catch {
            // image format unsupported by jsPDF — skip silently
          }
        }
      },
    });

    doc.save(`${project.name.replace(/\s+/g, "_")}.pdf`);
  } catch (err: any) {
    alert(`PDF export failed: ${err?.message || err}`);
    console.error("PDF export error:", err);
  }
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

async function loadJSON(file: File): Promise<ProjectData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ProjectData;
        resolve(data);
      } catch {
        reject(new Error("Invalid JSON project file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

async function loadZIP(file: File): Promise<ProjectData> {
  const zip = await JSZip.loadAsync(file);

  // Read project.json
  const projectFile = zip.file("project.json");
  if (!projectFile) {
    throw new Error("ZIP file is missing project.json");
  }
  const projectText = await projectFile.async("string");
  const project = JSON.parse(projectText) as ProjectData;

  // Read image_index.json (optional)
  const indexFile = zip.file("image_index.json");
  let imageIndex: Record<string, string> = {};
  if (indexFile) {
    const indexText = await indexFile.async("string");
    imageIndex = JSON.parse(indexText);
  }

  // Read images folder and reconstruct imageData
  const imageData: Record<string, Record<string, string>> = {};
  const imageNames: Record<string, Record<string, string>> = {};

  for (const [rowIdx, row] of project.rows.entries()) {
    imageData[row.id] = {};
    imageNames[row.id] = row.imageNames || {};

    for (const colId of Object.keys(row.imageNames || {})) {
      const key = `${rowIdx}_${colId}`;
      const imgFileName = imageIndex[key];
      if (!imgFileName) continue;

      const imgFile = zip.file(`images/${imgFileName}`);
      if (!imgFile) continue;

      const blob = await imgFile.async("blob");
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(blob);
      });

      imageData[row.id][colId] = dataUrl;
    }
  }

  // Attach reconstructed image data to rows
  return {
    ...project,
    rows: project.rows.map((row) => ({
      ...row,
      imageData: imageData[row.id] || {},
      imageNames: imageNames[row.id] || {},
    })),
  };
}

export function loadProject(file: File): Promise<ProjectData> {
  if (file.name.endsWith(".zip")) {
    return loadZIP(file);
  }
  return loadJSON(file);
}

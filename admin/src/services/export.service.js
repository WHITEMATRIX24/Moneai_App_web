// src/services/export.service.js

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND = {
  primary: [255, 101, 0],   // #ff6500
  dark: [43, 58, 82],       // #2b3a52
  muted: [127, 143, 163],   // #7f8fa3
  light: [255, 248, 243],   // #fff8f3
  border: [234, 223, 211],  // #eadfd3
  white: [255, 255, 255],
};

/**
 * Exports an array of plain objects as a styled PDF with a structured table.
 *
 * @param {string} filename  - e.g. "users_2026-08-26.pdf"
 * @param {string} title     - Heading shown at the top of the PDF
 * @param {string} subtitle  - Subtitle / description line
 * @param {Array<Record<string, unknown>>} rows - The data rows
 */
export function exportToPdf(filename, title, subtitle, rows) {
  if (!rows || !rows.length) return;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  // ─── HEADER BACKGROUND ────────────────────────────────────────────────────
  doc.setFillColor(...BRAND.light);
  doc.rect(0, 0, pageW, 72, "F");

  // ─── ACCENT BAR (left edge) ────────────────────────────────────────────────
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, 4, 72, "F");

  // ─── BRAND LOGO TEXT ───────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.primary);
  doc.text("MONE AI", 22, 26);

  // ─── TITLE ─────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...BRAND.dark);
  doc.text(title, 22, 46);

  // ─── SUBTITLE ──────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(subtitle, 22, 60);

  // ─── META (top right) ──────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Exported: ${dateStr} at ${timeStr}`, pageW - 22, 26, { align: "right" });
  doc.text(`${rows.length} record${rows.length !== 1 ? "s" : ""}`, pageW - 22, 38, { align: "right" });

  // ─── DIVIDER ───────────────────────────────────────────────────────────────
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.5);
  doc.line(0, 72, pageW, 72);

  // ─── TABLE ─────────────────────────────────────────────────────────────────
  const headers = Object.keys(rows[0]);

  autoTable(doc, {
    startY: 86,
    margin: { left: 22, right: 22 },
    head: [headers],
    body: rows.map((row) => headers.map((h) => String(row[h] ?? ""))),

    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: { top: 8, bottom: 8, left: 10, right: 10 },
      textColor: BRAND.dark,
      lineColor: BRAND.border,
      lineWidth: 0.4,
    },

    headStyles: {
      fillColor: BRAND.primary,
      textColor: BRAND.white,
      fontStyle: "bold",
      fontSize: 9,
      halign: "left",
    },

    alternateRowStyles: {
      fillColor: BRAND.light,
    },

    bodyStyles: {
      fillColor: BRAND.white,
    },

    columnStyles: {
      0: { fontStyle: "bold" },
    },

    // ─── PAGE footer ─────────────────────────────────────────────────────────
    didDrawPage: (data) => {
      const page = doc.internal.getCurrentPageInfo().pageNumber;
      const total = doc.internal.getNumberOfPages();

      // Bottom border
      doc.setDrawColor(...BRAND.border);
      doc.setLineWidth(0.5);
      doc.line(0, pageH - 28, pageW, pageH - 28);

      // Left label
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...BRAND.muted);
      doc.text("MONE AI · Admin Dashboard", 22, pageH - 14);

      // Right page number
      doc.text(`Page ${page} of ${total}`, pageW - 22, pageH - 14, {
        align: "right",
      });
    },
  });

  doc.save(filename);
}

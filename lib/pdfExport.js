import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Universal PDF Export Generator matching user specification:
 * 1. Library Name (Header)
 * 2. Date of Print
 * 3. 2 lines of vertical space
 * 4. Data Table Grid
 */
export function exportListToPDF({ title, columns, data, libraryName = "Mindspace Library" }) {
  if (typeof window === "undefined") return;

  const doc = new jsPDF({
    orientation: columns.length > 6 ? "landscape" : "portrait",
    unit: "mm",
    format: "a4"
  });

  const printDate = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  // 1. Library Name Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(libraryName, 14, 18);

  // Subtitle (Report Name) & Date of Print
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(title, 14, 25);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Date of Print: ${printDate}`, 14, 31);

  // 2 lines space (approx 12-14mm spacing) -> start table at Y=45
  autoTable(doc, {
    startY: 45,
    head: [columns],
    body: data,
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      halign: "left"
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59],
      overflow: "linebreak"
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { top: 45, left: 14, right: 14 }
  });

  const fileName = `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

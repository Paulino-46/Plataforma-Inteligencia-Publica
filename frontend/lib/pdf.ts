// lib/pdf.ts
// Geração de PDF (client-side) para os relatórios analíticos do App BiT.
// Usa jsPDF + jspdf-autotable. Chamado apenas no clique do utilizador.

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalyticalReport } from "@/services/reportsService";

const BLUE: [number, number, number] = [37, 99, 235];
const MARGIN = 40;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function lastY(doc: jsPDF): number {
  // jspdf-autotable escreve a posição final em doc.lastAutoTable.
  return (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? MARGIN;
}

/** Gera e faz download do PDF de um relatório. */
export function generateReportPdf(report: AnalyticalReport, opts: { insight?: string } = {}): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN * 2;
  let y = 54;

  // Cabeçalho institucional
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text("App BiT", MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Relatório Analítico — dataset Vísent CDRView", MARGIN, y + 16);

  y += 44;

  // Título do relatório
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(report.name, MARGIN, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(report.description, MARGIN, y);
  y += 14;
  doc.text(
    `Gerado em ${formatDate(report.generatedAt)}  •  ${report.recordCount} registos  •  Estado: ${report.status}`,
    MARGIN,
    y,
  );
  y += 20;

  // KPIs
  autoTable(doc, {
    startY: y,
    head: [["Indicador", "Valor"]],
    body: report.metrics.map((m) => [m.label, m.value]),
    theme: "grid",
    headStyles: { fillColor: BLUE, halign: "left" },
    styles: { fontSize: 10, cellPadding: 6 },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    margin: { left: MARGIN, right: MARGIN },
  });
  y = lastY(doc) + 24;

  // Resumo executivo (IA), quando disponível
  const insight = opts.insight?.trim();
  if (insight) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Resumo Executivo (IA)", MARGIN, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(insight, contentWidth);
    doc.text(lines, MARGIN, y);
    y += lines.length * 13 + 14;
  }

  // Secções detalhadas
  for (const section of report.sections) {
    if (y > doc.internal.pageSize.getHeight() - 120) {
      doc.addPage();
      y = 54;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(section.title, MARGIN, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [section.columns],
      body: section.rows.length ? section.rows.map((r) => [String(r[0]), String(r[1])]) : [["Sem dados", "—"]],
      theme: "striped",
      headStyles: { fillColor: BLUE, halign: "left" },
      styles: { fontSize: 9, cellPadding: 5 },
      columnStyles: { 1: { halign: "right" } },
      margin: { left: MARGIN, right: MARGIN },
    });
    y = lastY(doc) + 22;
  }

  // Rodapé com numeração de páginas
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `App BiT • Documento gerado automaticamente • Página ${i}/${total}`,
      MARGIN,
      doc.internal.pageSize.getHeight() - 24,
    );
  }

  const safeName = report.id.replace(/[^a-z0-9-]/gi, "_");
  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`appbit_${safeName}_${stamp}.pdf`);
}

export default generateReportPdf;

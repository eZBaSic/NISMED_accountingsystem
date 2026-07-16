import * as XLSX from "xlsx-js-style";

export type YearlyProject = {
  project_code: string;
  gross: number;
  taxed_amount: number;
  net_amount: number;
};

export function exportExcelYearly(
  individual: YearlyProject[],
  year: string
) {
  const titleRow = [
    "Foundation for the Promotion of Science and Mathematics Education and Research, Inc."
  ];

  const subtitleRow = [
    `ANNUAL SUMMARY OF TAXES (${year})`
  ];

  const blankRow: string[] = [];

  const headerRow = [
    "Project Code",
    "Gross",
    "Taxed Amount",
    "Net Amount"
  ];

  const rows = individual.map(v => [
    v.project_code,
    v.gross,
    v.taxed_amount,
    v.net_amount,
  ]);

  // Totals
  const totalGross = individual.reduce((s, v) => s + v.gross, 0);
  const totalTax = individual.reduce((s, v) => s + v.taxed_amount, 0);
  const totalNet = individual.reduce((s, v) => s + v.net_amount, 0);

  rows.push([
    "TOTAL",
    totalGross,
    totalTax,
    totalNet,
  ]);

  const sheetData = [
    titleRow,
    subtitleRow,
    blankRow,
    headerRow,
    ...rows
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // -------------------------
  // Merge title rows
  // -------------------------

  ws["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 3 }
    },
    {
      s: { r: 1, c: 0 },
      e: { r: 1, c: 3 }
    }
  ];

  // -------------------------
  // Column widths
  // -------------------------

  const widthData = [headerRow, ...rows];

  const maxLengths = headerRow.map((_, colIndex) =>
    Math.max(
      ...widthData.map(row =>
        String(row[colIndex] ?? "").length
      )
    )
  );

  ws["!cols"] = maxLengths.map(len => ({
    wch: Math.min(len + 3, 30)
  }));

  // -------------------------
  // Row heights
  // -------------------------

  ws["!rows"] = [
    { hpt: 24 },
    { hpt: 20 },
    { hpt: 8 },
    { hpt: 20 }
  ];

  // -------------------------
  // Title styles
  // -------------------------

  if (ws["A1"]) {
    ws["A1"].s = {
      font: {
        bold: true,
        sz: 16
      },
      alignment: {
        horizontal: "center",
        vertical: "center"
      }
    };
  }

  if (ws["A2"]) {
    ws["A2"].s = {
      font: {
        bold: true,
        sz: 13
      },
      alignment: {
        horizontal: "center",
        vertical: "center"
      }
    };
  }

  // -------------------------
  // Header styles
  // -------------------------

  const headerCells = ["A4", "B4", "C4", "D4"];

  for (const cell of headerCells) {
    if (!ws[cell]) continue;

    ws[cell].s = {
      font: {
        bold: true
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: false
      },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      }
    };
  }

  // -------------------------
  // Data styles
  // -------------------------

  for (let r = 5; r <= rows.length + 4; r++) {
    for (let c = 0; c < headerRow.length; c++) {
      const address = XLSX.utils.encode_cell({
        r: r - 1,
        c
      });

      if (!ws[address]) continue;

      const style: any = {
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        },
        alignment: {
          vertical: "center"
        }
      };

      // Gross, Taxed Amount, Net Amount
      if (c >= 1 && c <= 3) {
        style.alignment.horizontal = "right";
        style.numFmt = "#,##0.00";
      }

      // Project Code column
      if (c === 0) {
        style.alignment.horizontal = "left";
      }

      // Total row bold
      if (r === rows.length + 4) {
        style.font = {
          bold: true
        };
      }

      ws[address].s = style;
    }
  }

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    ws,
    "Report"
  );

  XLSX.writeFile(
    wb,
    `${year}_TaxReport.xlsx`
  );
}
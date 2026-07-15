import * as XLSX from "xlsx-js-style";

export type IndividualReportProject = {
  payee_name: string;
  payee_tin_id: string;
  dv_no: string;
  date: string;
  particulars: string;
  gross: number;
  taxed_amount: number;
  net_amount: number;
  remarks: string;
};

export function exportExcelProject(individual: IndividualReportProject[], projectCode: string) {
  const titleRow = [
    "Foundation for the Promotion of Science and Mathematics Education and Research, Inc."
  ];

  const subtitleRow = [
    `SUMMARY OF TAXES (${projectCode})`
  ];

  const blankRow: string[] = [];

  const headerRow = [
    "Date Paid",
    "DV No.",
    "Particulars",
    "TIN No.",
    "Gross",
    "Tax (10%)",
    "Net Amount",
    "Remarks"
  ];

  const rows = individual.map(v => [
    v.date,
    v.dv_no,
    v.particulars,
    v.payee_tin_id,
    v.gross,
    v.taxed_amount,
    v.net_amount,
    v.remarks
  ]);

  // Totals
  const totalGross = individual.reduce((s, v) => s + v.gross, 0);
  const totalTax = individual.reduce((s, v) => s + v.taxed_amount, 0);
  const totalNet = individual.reduce((s, v) => s + v.net_amount, 0);

  rows.push([
    "",
    "",
    "",
    "TOTAL",
    totalGross,
    totalTax,
    totalNet,
    ""
  ]);

  const sheetData = [
    titleRow,
    subtitleRow,
    blankRow,
    headerRow,
    ...rows
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Merge title rows across A:H
  ws["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 7 }
    },
    {
      s: { r: 1, c: 0 },
      e: { r: 1, c: 7 }
    }
  ];

  // Auto-size columns
  const maxLengths = headerRow.map((_, colIndex) =>
    Math.max(
      ...sheetData.map(row => String(row[colIndex] ?? "").length)
    )
  );

  ws["!cols"] = maxLengths.map(len => ({
    wch: len + 3
  }));

  // ---------- Styles ----------

  // Title
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

  // Subtitle
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

  // Table headers (row 4)
  for (const cell of ["A4","B4","C4","D4","E4","F4","G4","H4"]) {
    ws[cell].s = {
      font: {
        bold: true
      },
      alignment: {
        horizontal: "center",
        vertical: "center"
      },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      }
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");

  XLSX.writeFile(wb, `${projectCode}_tax.xlsx`);
}
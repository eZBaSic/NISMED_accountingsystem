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

export function exportExcelProject(
  individual: IndividualReportProject[],
  projectCode: string
) {
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

  // Merge title rows
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
    { hpt: 24 }, // Title
    { hpt: 20 }, // Subtitle
    { hpt: 8 },  // Blank
    { hpt: 20 }  // Header
  ];

  // -------------------------
  // Title styles
  // -------------------------

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

  // -------------------------
  // Header styles
  // -------------------------

  const headerCells = [
    "A4","B4","C4","D4",
    "E4","F4","G4","H4"
  ];

  for (const cell of headerCells) {
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
    for (let c = 0; c < 8; c++) {
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

      // Gross, Tax, Net columns
      if (c >= 4 && c <= 6) {
        style.alignment.horizontal = "right";
        style.numFmt = "#,##0.00";
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
    `${projectCode}_tax.xlsx`
  );
}

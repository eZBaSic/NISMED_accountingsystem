/**
 * PDF Generation utilities for voucher system
 * Compatible with existing voucherGenerator but adapted for our data structure
 */

import { goto } from "$app/navigation";

// Import jsPDF types if available (will need to install if not present)
declare global {
  interface Window {
    jspdf: {
      jsPDF: any;
    };
  }
}

export interface YearlyTaxPDFData {
  project_code: string;
  gross: number;
  taxed_amount: number;
  net_amount: number;
}

export interface ProjectTaxPDFData {
  id: number;
  dv_no: string;
  payee_name: string;
  payee_tin_id: string;
  date: string;
  gross: number;
  particulars: string;
  taxed_amount: number;
  net_amount: number;
  remarks: string;
}

/**
 * Converts a number to words (Philippine format)
 */
function numberToWords(n: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven",
    "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const scales = ["", "Thousand", "Million", "Billion"];

  if (n === 0) return "Zero";
  
  let result = "";
  let group = 0;
  
  while (n > 0) {
    const chunk = n % 1000;
    if (chunk) {
      let str = "";
      const hundreds = Math.floor(chunk / 100);
      const tensUnits = chunk % 100;
      
      if (hundreds) str += ones[hundreds] + " Hundred ";
      if (tensUnits < 20) {
        str += ones[tensUnits];
      } else {
        str += tens[Math.floor(tensUnits / 10)] + " " + ones[tensUnits % 10];
      }
      result = str.trim() + " " + scales[group] + " " + result;
    }
    n = Math.floor(n / 1000);
    group++;
  }
  return result.trim();
}

/**
 * Formats currency amount to Philippine peso format
 */
function formatCurrency(amount: number): string {
  return `PHP ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Generates a single voucher PDF
 */
export async function generateProjectTaxPDF(    // UPDATE NEEDED: Case where a new page is needed
  project: ProjectTaxPDFData[],
  Project_Code: string
): Promise<void> {
  if (project.length === 0) {
    throw new Error('No vouchers to generate PDF for');
  }

  if (!window.jspdf) {
    throw new Error('jsPDF library not loaded. Please include jsPDF in your HTML.');
  }

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const centerX = pageWidth / 2;

  let row = 35;
  let gross = 0;
  let taxed = 0;
  let net = 0;
  let name = 0;

  project.forEach((voucher, index) => {
    gross += voucher.gross;
    taxed += voucher.taxed_amount;
    net += voucher.net_amount;

    doc.setFont("Times", "normal");
    doc.setFontSize(9);
    name = doc.splitTextToSize(`${voucher.payee_name}`, 42).length - 1; // Case where name is longer than cell
    console.log(voucher.payee_name)
    console.log(name);
    console.log(row)

    if (index === 0 || ((name*8)+row) >= 184) {
      // HEADER
        if (((name*8)+row) >= 184){
            doc.rect(10, 10, 277, 190);
            row = 35;
            doc.addPage();
        }

      doc.setFont("Times", "bold");
      doc.setFontSize(12);

      doc.text(
        "Foundation for the Promotion of Science and Mathematics Education and Research, Inc.",
        centerX,
        20,
        { align: "center" }
      );

      doc.text(
        `SUMMARY OF TAXES (${Project_Code})`,
        centerX,
        28,
        { align: "center" }
      );
        doc.rect(10, 35, 23, 8);
        doc.text("Date Paid", 12, 41);
        doc.rect(33, 35, 35, 8);
        doc.text("DV No.", 35, 41);
        doc.rect(68, 35, 46, 8);
        doc.text("Particulars", 70, 41);
        doc.rect(114, 35, 34, 8);
        doc.text("TIN No.", 116, 41);
        doc.rect(148, 35, 35, 8);
        doc.text("Gross", 150, 41);
        doc.rect(183, 35, 35, 8);
        doc.text("Tax (10%)", 185, 41);
        doc.rect(218, 35, 34, 8);
        doc.text("Net Amount", 220, 41);
        doc.rect(252, 35, 35, 8);
        doc.text("Remarks", 254, 41);
      
    }

    // MOVE DOWN
    row += 8;
    generateProjectTaxPage(doc, voucher, row, name);
    row += name*8;
  });

  // TOTAL ROW
  row += 16;
  
  doc.setFont("Times", "bold");
  doc.setFontSize(12);

  doc.rect(107, row, 41, 8);
  doc.text("TOTAL TAX PAID:", 109, row + 6);

  doc.rect(148, row, 35, 8);
  doc.text(formatCurrency(gross), 150, row + 6);

  doc.rect(183, row, 35, 8);
  doc.text(formatCurrency(taxed), 185, row + 6);

  doc.rect(218, row, 34, 8);
  doc.text(formatCurrency(net), 220, row + 6);

  // OUTER BORDER (LANDSCAPE FIX)
  doc.rect(10, 10, 277, 190);

  doc.save(`Annual_SummaryOfTaxes_${Project_Code}.pdf`);
}

function generateProjectTaxPage( doc: any, voucherData: ProjectTaxPDFData, row: number, size: number): void {
  const {
    dv_no,
    payee_name,
    payee_tin_id,
    date,
    gross,
    particulars,
    taxed_amount,
    net_amount,
    remarks
  } = voucherData;

  const grossFormatted = formatCurrency(gross);
  const taxFormatted = formatCurrency(taxed_amount);
  const netFormatted = formatCurrency(net_amount);
  
    doc.setFont("Times", "normal");
    doc.setFontSize(9);

    const name = doc.splitTextToSize(`${payee_name}`, 42)

    doc.rect(10, row, 23, 8 + size*8);
    doc.text(date, 12, row + 6);
    doc.rect(33, row, 35, 8 + size*8);
    doc.text(dv_no, 35, row + 6);
    doc.rect(68, row, 46, 8 + size*8);
    doc.text(name, 70, row + 6);
    doc.rect(114, row, 34, 8 + size*8);
    doc.text(payee_tin_id, 116, row + 6);
    doc.rect(148, row, 35, 8 + size*8);
    doc.text(grossFormatted, 150, row + 6);
    doc.rect(183, row, 35, 8 + size*8);
    doc.text(taxFormatted, 185, row + 6);
    doc.rect(218, row, 34, 8 + size*8);
    doc.text(netFormatted, 220, row + 6);
    doc.rect(252, row, 35, 8 + size*8);
    doc.text(remarks, 254, row + 6);
}

export async function generateYearlyTaxPDF(yearly: YearlyTaxPDFData[], Year: number | null): Promise<void> {
  if (yearly.length === 0) {
    throw new Error('No vouchers to generate PDF for');
  }

  // Check if jsPDF is available
  if (!window.jspdf) {
    throw new Error('jsPDF library not loaded. Please include jsPDF in your HTML.');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let row = 35;
  let gross = 0;
  let taxed = 0;
  let net = 0;
  let name = 0;
  // Generate each voucher on a new page
  yearly.forEach((project, index) => {
    gross += project.gross;
    taxed += project.taxed_amount;
    net += project.net_amount;

    doc.setFont("Times", "normal");
    name = doc.splitTextToSize(`${project.project_code}`, 56).length - 1;

    if (index == 0 || ((name*8)+row) >= 279) {
        // Header
        if (((name*8)+row) >= 279){
            // Outer Border
            doc.rect(10, 10, 190, 277);
            row = 35;
            doc.addPage();
        }
        doc.setFont("Times", "bold");
        doc.setFontSize(12);
        doc.text("Foundation for the Promotion of Science and Mathematics Education and Research, Inc.", 105, 20, { align: "center" });
        doc.text(`ANNUAL SUMMARY OF TAXES (${Year})`, 105, 28, { align: "center" });

        doc.rect(10, 35, 60, 8);
        doc.text("Project Code", 12, 41);
        doc.rect(70, 35, 43, 8);
        doc.text("Gross", 72, 41);
        doc.rect(113, 35, 43, 8);
        doc.text("Taxed Amount", 115, 41);
        doc.rect(156, 35, 44, 8);
        doc.text("Net Amount", 158, 41);
    }

    // Use the same generation logic as single voucher
    row += 8;
    generateAnnualTaxPage(doc, project, String(Year), row, name);
    row += name*8;
  });

  row += 16;
  doc.setFont("Times", "bold");
  doc.rect(10, row, 60, 8);
  doc.text("TOTAL", 12, row+6);
  doc.rect(70, row, 43, 8);
  doc.text(formatCurrency(gross), 72, row+6);
  doc.rect(113, row, 43, 8);
  doc.text(formatCurrency(taxed), 115, row+6);
  doc.rect(156, row, 44, 8);
  doc.text(formatCurrency(net), 158, row+6);

  // Outer Border
  doc.rect(10, 10, 190, 277);

  // Save PDF
  doc.save(`Annual_SummaryOfTaxes_${String(Year)}.pdf`);
}

function generateAnnualTaxPage(doc: any, yearlyData: YearlyTaxPDFData, Year: string, row: number, size: number): void {
  const {
    project_code,
    gross,
    taxed_amount,
    net_amount
  } = yearlyData;
  
  // Format amounts
  const grossFormatted = formatCurrency(gross);
  const taxFormatted = formatCurrency(taxed_amount);
  const netFormatted = formatCurrency(net_amount);

  doc.setFont("Times", "normal");
  doc.rect(10, row, 60, 8 + size*8);
  doc.text(project_code, 12, row+6);
  doc.rect(70, row, 43, 8 + size*8);
  doc.text(grossFormatted, 72, row+6);
  doc.rect(113, row, 43, 8 + size*8);
  doc.text(taxFormatted, 115, row+6);
  doc.rect(156, row, 44, 8 + size*8);
  doc.text(netFormatted, 158, row+6);

  return
}

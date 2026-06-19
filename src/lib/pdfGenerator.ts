/**
 * PDF Generation utilities for voucher system
 * Compatible with existing voucherGenerator but adapted for our data structure
 */

// Import jsPDF types if available (will need to install if not present)
declare global {
  interface Window {
    jspdf: {
      jsPDF: any;
    };
  }
}

export interface VoucherPDFData {
  // Core voucher data
  id: number;
  dv_no: string;
  payee_name: string;
  payee_address: string;
  date: string;
  gross: number;
  has_tax_deduction: boolean;
  particulars: string;
  payment_mode: string;
  remarks: string;
  
  // Project data needed for PDF
  project_code: string;
  project_title: string;
  authorized_rep: string;
  approver: string;
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
export async function generateVoucherPDF(voucherData: VoucherPDFData): Promise<void> {
  // Check if jsPDF is available
  if (!window.jspdf) {
    throw new Error('jsPDF library not loaded. Please include jsPDF in your HTML.');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const {
    dv_no,
    payee_name,
    payee_address,
    date,
    gross,
    has_tax_deduction,
    particulars,
    payment_mode,
    project_code,
    project_title,
    authorized_rep,
    approver
  } = voucherData;

  // Calculate amounts
  const tax = has_tax_deduction ? gross * 0.10 : 0;
  const total = gross - tax;
  
  // Format amounts
  const totalFormatted = formatCurrency(total);
  const taxFormatted = formatCurrency(tax);
  const grossFormatted = formatCurrency(gross);
  
  // Format date
  const formattedDate = new Date(date).toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: '2-digit' 
  }).replace(/ /g, '-');
    
  const currentDate = new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: '2-digit' 
  }).replace(/ /g, '-');

  // Convert total amount to words
  const pesos = Math.floor(total);
  const cents = Math.round((total - pesos) * 100);
  let words = numberToWords(pesos) + " Pesos";
  if (cents > 0) {
    words += " and " + numberToWords(cents) + " Centavos";
  }

  // Start building the PDF
  // Header
  doc.setFont("Times", "bold");
  doc.setFontSize(12);
  doc.text("Foundation for the Promotion of Science and Mathematics Education and Research, Inc.", 105, 20, { align: "center" });
  doc.text("DISBURSEMENT VOUCHER", 105, 28, { align: "center" }); 

  // Payee and DV Number row
  doc.setFont("Times", "normal");
  doc.setFontSize(10);
  doc.rect(10, 35, 20, 8);
  doc.text("Payee:", 12, 41);
  doc.setFont("Times", "bold");
  doc.rect(30, 35, 105, 8);
  doc.text(payee_name, 32, 41);
  doc.setFont("Times", "normal");
  doc.rect(135, 35, 30, 8);
  doc.text("DV No.", 137, 41);
  doc.rect(165, 35, 35, 8);
  doc.text(dv_no, 167, 41);

  // Address and Date row
  doc.rect(10, 43, 20, 8);
  doc.text("Address:", 12, 49);
  doc.rect(30, 43, 105, 8);
  doc.text(payee_address, 32, 49);
  doc.rect(135, 43, 30, 8);
  doc.text("Date:", 137, 49);
  doc.rect(165, 43, 35, 8);
  doc.text(formattedDate, 167, 49);

  // Charge vs row (using project info)
  doc.setFont("Times", "bold");
  const projectname = doc.splitTextToSize(`${project_code} - ${project_title}`, 153);
  doc.text(projectname, 32, 57);
  const lineHeight = 5; // jsPDF default approx
  var blockHeight = (projectname.length-1) * lineHeight;
  var addY = blockHeight;
  doc.rect(10, 51, 20, 8 + addY);
  doc.text("Charge vs:", 12, 57 + addY);
  doc.rect(30, 51, 170, 8 + addY);

  // Mode of Payment row
  doc.setFont("Times", "normal");
  doc.rect(10, 59 + addY, 30, 8);
  doc.text("Mode of Payment:", 12, 65 + addY);
  doc.rect(40, 59 + addY, 160, 8);
  doc.text(payment_mode, 42, 65 + addY);

  // Table headers
  doc.setFont("Times", "bold");
  doc.rect(10, 67 + addY, 120, 8);
  doc.text("Particulars", 70, 73 + addY, { align: "center" });
  doc.rect(130, 67 + addY, 70, 8);
  doc.text("Amount", 165, 73 + addY, { align: "center" });

  // Particulars and amount
  doc.setFont("Times", "normal");
  const partics = doc.splitTextToSize(`${particulars}`, 118);
  doc.text(partics, 12, 83 + addY);
  blockHeight = (partics.length-1) * lineHeight;
  addY += blockHeight;
  doc.rect(10, 75, 120, 12 + addY);
  doc.rect(130, 75, 70, 12 + addY);
  doc.text(grossFormatted, 195, 83 + addY, { align: "right" });

  // Tax deduction (if applicable)
  let currentY = 87;
  if (has_tax_deduction) {
    doc.rect(10, currentY + addY, 120, 12);
    doc.text("Less 10% Tax", 125, currentY + 8 + addY, { align: "right" });
    doc.rect(130, currentY + addY, 70, 12);
    doc.text(taxFormatted, 195, currentY + 8 + addY, { align: "right" });
    currentY += 12 + addY;
  }

  // Total row
  doc.setFont("Times", "bold");
  doc.rect(10, currentY, 120, 12);
  doc.text("Total", 125, currentY + 8, { align: "right" });
  doc.rect(130, currentY, 70, 12);
  doc.text(totalFormatted, 195, currentY + 8, { align: "right" });

  // Signature sections
  const signatureY = currentY + 12;
  
  // Section A - Authorized Representative
  doc.setFont("Times", "bold");
  doc.rect(10, signatureY, 95, 50);
  doc.text("A", 12, signatureY + 8);
  doc.setFont("Times", "normal");
  doc.setFontSize(9);
  doc.text("Certified: Expenses/cash advance necessary,", 12, signatureY + 15);
  doc.text("lawful, and incurred under my direct supervision", 12, signatureY + 19);
  doc.setFont("Times", "bold");
  doc.setFontSize(10);
  doc.text(authorized_rep, 57.5, signatureY + 34, { align: "center" });
  var textWidth = doc.getTextWidth(authorized_rep);

  doc.line(
    57.5 - textWidth / 2,
    signatureY + 34 + 1,              
    57.5 + textWidth / 2,
    signatureY + 34 + 1
  );

  doc.setFont("Times", "normal");
  doc.setFontSize(9);
  doc.text("Signature over Printed Name", 57.5, signatureY + 40, { align: "center" });
  doc.text("of Authorized Representative", 57.5, signatureY + 44, { align: "center" });
  doc.text(`Date: ${formattedDate}`, 57.5, signatureY + 48, { align: "center" });

  // Section B - Approver
  doc.setFont("Times", "bold");
  doc.rect(105, signatureY, 95, 50);
  doc.text("B", 107, signatureY + 8);
  doc.setFont("Times", "normal");
  doc.setFontSize(9);
  doc.text("Approved for payment by:", 107, signatureY + 15);
  doc.setFont("Times", "bold");
  doc.setFontSize(10);
  doc.text(approver, 152.5, signatureY + 34, { align: "center" });
  textWidth = doc.getTextWidth(approver);

  doc.line(
    152.5 - textWidth / 2,
    signatureY + 34 + 1,              
    152.5 + textWidth / 2,
    signatureY + 34 + 1
  );

  doc.setFont("Times", "normal");
  doc.setFontSize(9);
  doc.text("Signature over Printed Name", 152.5, signatureY + 40, { align: "center" });
  doc.text("Executive Director, FPSMER, Inc.", 152.5, signatureY + 44, { align: "center" });
  doc.text(`Date: ${formattedDate}`, 152.5, signatureY + 48, { align: "center" });

  // Section C - Receipt
  const receiptY = signatureY + 55;
  doc.setFont("Times", "bold");
  doc.setFontSize(10);
  doc.text("C", 12, receiptY);
  doc.setFont("Times", "normal");
  doc.setFontSize(10);
  
  const x = 12;
  const y = receiptY + 10;
  const maxWidth = 185;

  const baseText =
    "Received from the Foundation for the Promotion of Science and Mathematics Education and Research, Inc. the amount of ";

  doc.setFont("Times", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(baseText, maxWidth);

  doc.text(lines, x, y);

  const lastLine = lines[lines.length - 1];

  let wordsX = x + doc.getTextWidth(lastLine);
  let wordsY = y + (lines.length - 1) * 5;

  doc.setFont("Times", "bold");
  const wordWidth = doc.getTextWidth(words);

  if (wordsX + wordWidth > x + maxWidth) {
    wordsX = x;
    wordsY += 5;
  }

  doc.text(words, wordsX, wordsY);

  doc.line(
    wordsX,
    wordsY + 1,
    wordsX + wordWidth,
    wordsY + 1
  );

  doc.setFont("Times", "bold");
  doc.setFontSize(12);
  doc.text(totalFormatted, 152.5, receiptY + 28, { align: "center" });
  textWidth = doc.getTextWidth(totalFormatted);

  doc.line(
    152.5 - textWidth / 2,
    receiptY + 28 + 1,              
    152.5 + textWidth / 2,
    receiptY + 28 + 1
  );

  doc.text(payee_name, 152.5, receiptY + 58, { align: "center" });
  textWidth = doc.getTextWidth(payee_name);

  doc.line(
    152.5 - textWidth / 2,
    receiptY + 58 + 1,              
    152.5 + textWidth / 2,
    receiptY + 58 + 1
  );

  doc.setFont("Times", "normal");
  doc.setFontSize(8);
  doc.text("Signature over Printed Name", 152.5, receiptY + 64, { align: "center" });
  doc.text("of Payee", 152.5, receiptY + 68, { align: "center" });
  doc.text(`Date: ${currentDate}`, 152.5, receiptY + 72, { align: "center" });

  // Main border
  doc.rect(10, 10, 190, 240 + addY);

  // Save the PDF
  doc.save(`voucher_${dv_no.replace(/[\/\\]/g, "-")}.pdf`);
}

/**
 * Generates multiple vouchers as a combined PDF
 */
export async function generateMultipleVouchersPDF(vouchers: VoucherPDFData[], projectTitle: string): Promise<void> {
  if (vouchers.length === 0) {
    throw new Error('No vouchers to generate PDF for');
  }

  // Check if jsPDF is available
  if (!window.jspdf) {
    throw new Error('jsPDF library not loaded. Please include jsPDF in your HTML.');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Generate each voucher on a new page
  vouchers.forEach((voucher, index) => {
    if (index > 0) {
      doc.addPage();
    }

    // Use the same generation logic as single voucher
    generateVoucherPage(doc, voucher);
  });

  // Save the combined PDF
  const projectCode = vouchers[0].project_code;
  const sanitizedTitle = projectTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  doc.save(`vouchers_${projectCode}_${sanitizedTitle}.pdf`);
}

/**
 * Internal function to generate a single voucher page within an existing jsPDF document
 */
function generateVoucherPage(doc: any, voucherData: VoucherPDFData): void {
  const {
    dv_no,
    payee_name,
    payee_address,
    date,
    gross,
    has_tax_deduction,
    particulars,
    payment_mode,
    project_code,
    project_title,
    authorized_rep,
    approver
  } = voucherData;

  // Calculate amounts
  const tax = has_tax_deduction ? gross * 0.10 : 0;
  const total = gross - tax;
  
  // Format amounts
  const totalFormatted = formatCurrency(total);
  const taxFormatted = formatCurrency(tax);
  const grossFormatted = formatCurrency(gross);
  
  // Format date
  const formattedDate = new Date(date).toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: '2-digit' 
  }).replace(/ /g, '-');

    const currentDate = new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: '2-digit' 
  }).replace(/ /g, '-');

  // Convert total amount to words
  const pesos = Math.floor(total);
  const cents = Math.round((total - pesos) * 100);
  let words = numberToWords(pesos) + " Pesos";
  if (cents > 0) {
    words += " and " + numberToWords(cents) + " Centavos";
  }

  // Build the PDF page (same as generateVoucherPDF but without save)
  // Header
  doc.setFont("Times", "bold");
  doc.setFontSize(12);
  doc.text("Foundation for the Promotion of Science and Mathematics Education and Research, Inc.", 105, 20, { align: "center" });
  doc.text("DISBURSEMENT VOUCHER", 105, 28, { align: "center" });

  // Main border
  doc.rect(10, 10, 190, 240);

  // Payee and DV Number row
  doc.setFont("Times", "normal");
  doc.setFontSize(10);
  doc.rect(10, 35, 20, 8);
  doc.text("Payee:", 12, 41);
  doc.setFont("Times", "bold");
  doc.rect(30, 35, 105, 8);
  doc.text(payee_name, 32, 41);
  doc.setFont("Times", "normal");
  doc.rect(135, 35, 30, 8);
  doc.text("DV No.", 137, 41);
  doc.rect(165, 35, 35, 8);
  doc.text(dv_no, 167, 41);

  // Address and Date row
  doc.rect(10, 43, 20, 8);
  doc.text("Address:", 12, 49);
  doc.rect(30, 43, 105, 8);
  doc.text(payee_address, 32, 49);
  doc.rect(135, 43, 30, 8);
  doc.text("Date:", 137, 49);
  doc.rect(165, 43, 35, 8);
  doc.text(formattedDate, 167, 49);

  // Charge vs row
  doc.rect(10, 51, 20, 8);
  doc.text("Charge vs:", 12, 57);
  doc.rect(30, 51, 170, 8);
  doc.setFont("Times", "bold");
  doc.text(`${project_code} - ${project_title}`, 32, 57);

  // Mode of Payment row
  doc.setFont("Times", "normal");
  doc.rect(10, 59, 30, 8);
  doc.text("Mode of Payment:", 12, 65);
  doc.rect(40, 59, 160, 8);
  doc.text(payment_mode, 42, 65);

  // Table headers
  doc.setFont("Times", "bold");
  doc.rect(10, 67, 120, 8);
  doc.text("Particulars", 70, 73, { align: "center" });
  doc.rect(130, 67, 70, 8);
  doc.text("Amount", 165, 73, { align: "center" });

  // Particulars and amount
  doc.setFont("Times", "normal");
  doc.rect(10, 75, 120, 12);
  doc.text(particulars, 12, 83);
  doc.rect(130, 75, 70, 12);
  doc.text(grossFormatted, 195, 83, { align: "right" });

  // Tax deduction (if applicable)
  let currentY = 87;
  if (has_tax_deduction) {
    doc.rect(10, currentY, 120, 12);
    doc.text("Less 10% Tax", 125, currentY + 8, { align: "right" });
    doc.rect(130, currentY, 70, 12);
    doc.text(taxFormatted, 195, currentY + 8, { align: "right" });
    currentY += 12;
  }

  // Total row
  doc.setFont("Times", "bold");
  doc.rect(10, currentY, 120, 12);
  doc.text("Total", 125, currentY + 8, { align: "right" });
  doc.rect(130, currentY, 70, 12);
  doc.text(totalFormatted, 195, currentY + 8, { align: "right" });

  // Signature sections
  const signatureY = currentY + 12;
  
  // Section A - Authorized Representative
  doc.setFont("Times", "bold");
  doc.rect(10, signatureY, 95, 50);
  doc.text("A", 12, signatureY + 8);
  doc.setFont("Times", "normal");
  doc.setFontSize(9);
  doc.text("Certified: Expenses/cash advance necessary,", 12, signatureY + 15);
  doc.text("lawful, and incurred under my direct supervision", 12, signatureY + 19);
  doc.setFont("Times", "bold");
  doc.setFontSize(10);
  doc.text(authorized_rep, 57.5, signatureY + 34, { align: "center" });
  var textWidth = doc.getTextWidth(authorized_rep);

  doc.line(
    57.5 - textWidth / 2,
    signatureY + 34 + 1,              
    57.5 + textWidth / 2,
    signatureY + 34 + 1
  );

  doc.setFont("Times", "normal");
  doc.setFontSize(9);
  doc.text("Signature over Printed Name", 57.5, signatureY + 40, { align: "center" });
  doc.text("of Authorized Representative", 57.5, signatureY + 44, { align: "center" });
  doc.text(`Date: ${formattedDate}`, 57.5, signatureY + 48, { align: "center" });

  // Section B - Approver
  doc.setFont("Times", "bold");
  doc.rect(105, signatureY, 95, 50);
  doc.text("B", 107, signatureY + 8);
  doc.setFont("Times", "normal");
  doc.setFontSize(9);
  doc.text("Approved for payment by:", 107, signatureY + 15);
  doc.setFont("Times", "bold");
  doc.setFontSize(10);
  doc.text(approver, 152.5, signatureY + 34, { align: "center" });
  textWidth = doc.getTextWidth(approver);

  doc.line(
    152.5 - textWidth / 2,
    signatureY + 34 + 1,              
    152.5 + textWidth / 2,
    signatureY + 34 + 1
  );

  doc.setFont("Times", "normal");
  doc.setFontSize(9);
  doc.text("Signature over Printed Name", 152.5, signatureY + 40, { align: "center" });
  doc.text("Executive Director, FPSMER, Inc.", 152.5, signatureY + 44, { align: "center" });
  doc.text(`Date: ${formattedDate}`, 152.5, signatureY + 48, { align: "center" });

  // Section C - Receipt
  const receiptY = signatureY + 55;
  doc.setFont("Times", "bold");
  doc.setFontSize(10);
  doc.text("C", 12, receiptY);
  doc.setFont("Times", "normal");
  doc.setFontSize(10);
  
  const x = 12;
  const y = receiptY + 10;
  const maxWidth = 185;

  const baseText =
    "Received from the Foundation for the Promotion of Science and Mathematics Education and Research, Inc. the amount of ";

  doc.setFont("Times", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(baseText, maxWidth);

  doc.text(lines, x, y);

  const lastLine = lines[lines.length - 1];

  let wordsX = x + doc.getTextWidth(lastLine);
  let wordsY = y + (lines.length - 1) * 5;

  doc.setFont("Times", "bold");
  const wordWidth = doc.getTextWidth(words);

  if (wordsX + wordWidth > x + maxWidth) {
    wordsX = x;
    wordsY += 5;
  }

  doc.text(words, wordsX, wordsY);

  doc.line(
    wordsX,
    wordsY + 1,
    wordsX + wordWidth,
    wordsY + 1
  );

  doc.setFont("Times", "bold");
  doc.setFontSize(12);
  doc.text(totalFormatted, 152.5, receiptY + 28, { align: "center" });
  textWidth = doc.getTextWidth(totalFormatted);

  doc.line(
    152.5 - textWidth / 2,
    receiptY + 28 + 1,              
    152.5 + textWidth / 2,
    receiptY + 28 + 1
  );
  
  doc.text(payee_name, 152.5, receiptY + 58, { align: "center" });
  textWidth = doc.getTextWidth(payee_name);

  doc.line(
    152.5 - textWidth / 2,
    receiptY + 58 + 1,              
    152.5 + textWidth / 2,
    receiptY + 58 + 1
  );

  doc.setFont("Times", "normal");
  doc.setFontSize(8);
  doc.text("Signature over Printed Name", 152.5, receiptY + 64, { align: "center" });
  doc.text("of Payee", 152.5, receiptY + 68, { align: "center" });
  doc.text(`Date: ${currentDate}`, 152.5, receiptY + 72, { align: "center" });
}

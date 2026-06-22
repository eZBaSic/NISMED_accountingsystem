/**
 * Generates a disbursement voucher PDF
 * @param {Object} voucherData - The voucher data object
 * @param {string} voucherData.payee - Name of the payee
 * @param {string} voucherData.address - Address of the payee
 * @param {string} [voucherData.dv_no="SO-25-001"] - Disbursement voucher number
 * @param {string} voucherData.mode - Mode of payment
 * @param {string} voucherData.charge - What the expense is charged against
 * @param {string} voucherData.particulars - Description of the expense
 * @param {string} voucherData.authorized_rep - Name of authorized representative
 * @param {string} voucherData.approver - Name of the approver
 * @param {number} voucherData.amount - Amount before tax
 * @param {boolean} [voucherData.apply_tax=false] - Whether to apply 10% tax deduction
 */
function generateVoucher(voucherData) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const {
    payee,
    address,
    dv_no = "SO-25-001",
    mode,
    charge,
    particulars,
    authorized_rep,
    approver,
    amount,
    apply_tax = false
  } = voucherData;

  // Calculate amounts
  const tax = apply_tax ? amount * 0.10 : 0;
  const total = amount - tax;
  
  // Format amounts (PHP format with space thousands separator and comma decimal)
  const totalFormatted = `PHP ${total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ').replace('.', ',')}`;
  const taxFormatted = `PHP ${tax.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ').replace('.', ',')}`;
  const amountFormatted = `PHP ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ').replace('.', ',')}`;
  
  // Generate date
  const date = new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: '2-digit' 
  }).replace(/ /g, '-');

  /**
   * Converts a number to words
   * @param {number} n - Number to convert
   * @returns {string} Number in words
   */
  function numberToWords(n) {
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

  // Main border
  doc.rect(10, 10, 190, 240);

  // Payee and DV Number row
  doc.setFont("Times", "normal");
  doc.setFontSize(10);
  doc.rect(10, 35, 20, 8);
  doc.text("Payee:", 12, 41);
  doc.setFont("Times", "bold");
  doc.rect(30, 35, 105, 8);
  doc.text(payee, 32, 41);
  doc.setFont("Times", "normal");
  doc.rect(135, 35, 30, 8);
  doc.text("DV No.", 137, 41);
  doc.rect(165, 35, 35, 8);
  doc.text(dv_no, 167, 41);

  // Address and Date row
  doc.rect(10, 43, 20, 8);
  doc.text("Address:", 12, 49);
  doc.rect(30, 43, 105, 8);
  doc.text(address, 32, 49);
  doc.rect(135, 43, 30, 8);
  doc.text("Date:", 137, 49);
  doc.rect(165, 43, 35, 8);
  doc.text(date, 167, 49);

  // Charge vs row
  doc.rect(10, 51, 20, 8);
  doc.text("Charge vs:", 12, 57);
  doc.rect(30, 51, 170, 8);
  doc.setFont("Times", "bold");
  doc.text(charge, 32, 57);

  // Mode of Payment row
  doc.setFont("Times", "normal");
  doc.rect(10, 59, 30, 8);
  doc.text("Mode of Payment:", 12, 65);
  doc.rect(40, 59, 160, 8);
  doc.text(mode, 42, 65);

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
  doc.text(amountFormatted, 195, 83, { align: "right" });

  // Tax deduction (if applicable)
  let currentY = 87;
  if (apply_tax) {
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
  doc.setFont("Times", "normal");
  doc.setFontSize(9);
  doc.text("Signature over Printed Name", 57.5, signatureY + 40, { align: "center" });
  doc.text("of Authorized Representative", 57.5, signatureY + 44, { align: "center" });
  doc.text(`Date: ${date}`, 57.5, signatureY + 48, { align: "center" });

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
  doc.setFont("Times", "normal");
  doc.setFontSize(9);
  doc.text("Signature over Printed Name", 152.5, signatureY + 40, { align: "center" });
  doc.text("Executive Director, FPSMER, Inc.", 152.5, signatureY + 44, { align: "center" });
  doc.text(`Date: ${date}`, 152.5, signatureY + 48, { align: "center" });

  // Section C - Receipt
  const receiptY = signatureY + 55;
  doc.setFont("Times", "bold");
  doc.setFontSize(10);
  doc.text("C", 12, receiptY);
  doc.setFont("Times", "normal");
  doc.setFontSize(10);
  
  const baseText = "Received from the Foundation for the Promotion of Science and Mathematics Education and Research, Inc. the amount of "
  const receiptLines = doc.splitTextToSize(baseText, 185);
  doc.text(receiptLines, 12, receiptY + 10);
  let yCursor = receiptY + 10;
  lines.forEach((line, index) => {
    doc.text(line, 12, yCursor);
    yCursor += 5;
  });
  const lastLineWidth = doc.getTextWidth(lines[lines.length - 1]);
  doc.setFont("Times", "bold");
  doc.text(words, 12 + lastLineWidth, yCursor - 5);
  const wordWidth = doc.getTextWidth(words);
  doc.line(
    12 + lastLineWidth,
    yCursor - 4,
    12 + lastLineWidth + wordWidth,
    yCursor - 4
  );

  doc.setFont("Times", "bold");
  doc.setFontSize(12);
  doc.text(totalFormatted, 152.5, receiptY + 28, { align: "center" });
  doc.text(payee, 152.5, receiptY + 58, { align: "center" });

  doc.setFont("Times", "normal");
  doc.setFontSize(8);
  doc.text("Signature over Printed Name", 152.5, receiptY + 64, { align: "center" });
  doc.text("of Payee", 152.5, receiptY + 68, { align: "center" });
  doc.text(`Date: ${date}`, 152.5, receiptY + 72, { align: "center" });

  // Save the PDF
  doc.save(`voucher_${dv_no.replace("/", "-")}.pdf`);
}

// Example usage:
/*
const voucherData = {
  payee: "John Doe",
  address: "123 Main St, City",
  dv_no: "SO-25-002",
  mode: "Check",
  charge: "Office Supplies",
  particulars: "Purchase of office materials and supplies",
  authorized_rep: "Jane Smith",
  approver: "Robert Johnson",
  amount: 5000.00,
  apply_tax: true
};

generateVoucher(voucherData);
*/
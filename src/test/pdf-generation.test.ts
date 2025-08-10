import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { generateVoucherPDF, generateMultipleVouchersPDF, type VoucherPDFData } from '../lib/pdfGenerator';

// Mock jsPDF
const mockSave = vi.fn();
const mockText = vi.fn();
const mockRect = vi.fn();
const mockSetFont = vi.fn();
const mockSetFontSize = vi.fn();
const mockSplitTextToSize = vi.fn();
const mockAddPage = vi.fn();

const mockJsPDF = vi.fn(() => ({
  save: mockSave,
  text: mockText,
  rect: mockRect,
  setFont: mockSetFont,
  setFontSize: mockSetFontSize,
  splitTextToSize: mockSplitTextToSize,
  addPage: mockAddPage
}));

// Mock sample voucher data
const mockVoucherData: VoucherPDFData = {
  id: 1,
  dv_no: 'DV001',
  payee_name: 'John Doe',
  payee_address: '123 Main St, City',
  date: '2024-01-15',
  gross: 5000,
  has_tax_deduction: true,
  particulars: 'Consultation services',
  payment_mode: 'Bank Transfer',
  remarks: 'Urgent payment',
  project_code: 'PROJ-001',
  project_title: 'Test Project',
  authorized_rep: 'Jane Smith',
  approver: 'Robert Johnson'
};

const mockVoucherDataNoTax: VoucherPDFData = {
  ...mockVoucherData,
  id: 2,
  dv_no: 'DV002',
  has_tax_deduction: false,
  gross: 3000
};

describe('PDF Generation Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock window.jspdf
    Object.defineProperty(global, 'window', {
      value: {
        jspdf: {
          jsPDF: mockJsPDF
        }
      },
      writable: true
    });

    // Mock splitTextToSize to return split text
    mockSplitTextToSize.mockImplementation((text: string) => [text]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Single Voucher PDF Generation', () => {
    it('should generate PDF for voucher with tax deduction', async () => {
      await generateVoucherPDF(mockVoucherData);

      // Verify jsPDF was instantiated
      expect(mockJsPDF).toHaveBeenCalled();

      // Verify PDF was saved with correct filename
      expect(mockSave).toHaveBeenCalledWith('voucher_DV001.pdf');

      // Verify basic PDF structure was created
      expect(mockText).toHaveBeenCalled();
      expect(mockRect).toHaveBeenCalled();
      expect(mockSetFont).toHaveBeenCalled();
      expect(mockSetFontSize).toHaveBeenCalled();
    });

    it('should generate PDF for voucher without tax deduction', async () => {
      await generateVoucherPDF(mockVoucherDataNoTax);

      expect(mockJsPDF).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalledWith('voucher_DV002.pdf');
    });

    it('should handle special characters in DV number for filename', async () => {
      const specialDVData = {
        ...mockVoucherData,
        dv_no: 'DV/001\\2024'
      };

      await generateVoucherPDF(specialDVData);

      expect(mockSave).toHaveBeenCalledWith('voucher_DV-001-2024.pdf');
    });

    it('should include correct voucher information in PDF', async () => {
      await generateVoucherPDF(mockVoucherData);

      // Check that payee name was added
      expect(mockText).toHaveBeenCalledWith('John Doe', 32, 41);
      
      // Check that DV number was added
      expect(mockText).toHaveBeenCalledWith('DV001', 167, 41);
      
      // Check that project info was added
      expect(mockText).toHaveBeenCalledWith('PROJ-001 - Test Project', 32, 57);
    });

    it('should calculate tax correctly for vouchers with tax deduction', async () => {
      await generateVoucherPDF(mockVoucherData);

      // Verify tax calculation: 5000 * 0.10 = 500
      // Total should be 5000 - 500 = 4500
      expect(mockText).toHaveBeenCalledWith('PHP 4 500,00', 195, expect.any(Number), { align: "right" });
    });

    it('should not show tax deduction for vouchers without tax', async () => {
      await generateVoucherPDF(mockVoucherDataNoTax);

      // Should not include "Less 10% Tax" text
      const taxCalls = mockText.mock.calls.filter(call => 
        call[0] && call[0].toString().includes('Less 10% Tax')
      );
      expect(taxCalls).toHaveLength(0);
    });

    it('should throw error when jsPDF is not available', async () => {
      // Remove jsPDF from global
      delete (global as any).window.jspdf;

      await expect(generateVoucherPDF(mockVoucherData))
        .rejects
        .toThrow('jsPDF library not loaded. Please include jsPDF in your HTML.');
    });

    it('should format currency amounts correctly', async () => {
      const voucherWithLargeAmount = {
        ...mockVoucherData,
        gross: 1234567.89
      };

      await generateVoucherPDF(voucherWithLargeAmount);

      // Check Philippine peso formatting with space thousands separator and comma decimal
      expect(mockText).toHaveBeenCalledWith('PHP 1 234 567,89', 195, expect.any(Number), { align: "right" });
    });

    it('should format date correctly', async () => {
      await generateVoucherPDF(mockVoucherData);

      // Date should be formatted as dd-mmm-yy
      expect(mockText).toHaveBeenCalledWith('15-Jan-24', 167, 49);
    });

    it('should include signature sections', async () => {
      await generateVoucherPDF(mockVoucherData);

      // Check authorized representative
      expect(mockText).toHaveBeenCalledWith('Jane Smith', 57.5, expect.any(Number), { align: "center" });
      
      // Check approver
      expect(mockText).toHaveBeenCalledWith('Robert Johnson', 152.5, expect.any(Number), { align: "center" });
    });
  });

  describe('Multiple Vouchers PDF Generation', () => {
    const multipleVouchers = [mockVoucherData, mockVoucherDataNoTax];

    it('should generate PDF with multiple vouchers', async () => {
      await generateMultipleVouchersPDF(multipleVouchers, 'Test Project');

      expect(mockJsPDF).toHaveBeenCalled();
      expect(mockAddPage).toHaveBeenCalledTimes(1); // One addPage call for second voucher
      expect(mockSave).toHaveBeenCalledWith('vouchers_PROJ-001_Test_Project.pdf');
    });

    it('should sanitize project title for filename', async () => {
      await generateMultipleVouchersPDF(multipleVouchers, 'Test Project: Special/Characters\\Here!');

      expect(mockSave).toHaveBeenCalledWith('vouchers_PROJ-001_Test_Project_SpecialCharactersHere.pdf');
    });

    it('should throw error for empty voucher list', async () => {
      await expect(generateMultipleVouchersPDF([], 'Test Project'))
        .rejects
        .toThrow('No vouchers to generate PDF for');
    });

    it('should not add page for first voucher', async () => {
      await generateMultipleVouchersPDF([mockVoucherData], 'Single Voucher');

      expect(mockAddPage).not.toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalledWith('vouchers_PROJ-001_Single_Voucher.pdf');
    });

    it('should add page for each additional voucher', async () => {
      const manyVouchers = [
        mockVoucherData,
        mockVoucherDataNoTax,
        { ...mockVoucherData, id: 3, dv_no: 'DV003' },
        { ...mockVoucherData, id: 4, dv_no: 'DV004' }
      ];

      await generateMultipleVouchersPDF(manyVouchers, 'Many Vouchers');

      expect(mockAddPage).toHaveBeenCalledTimes(3); // 3 additional pages for 4 vouchers total
    });

    it('should throw error when jsPDF is not available', async () => {
      delete (global as any).window.jspdf;

      await expect(generateMultipleVouchersPDF(multipleVouchers, 'Test Project'))
        .rejects
        .toThrow('jsPDF library not loaded. Please include jsPDF in your HTML.');
    });
  });

  describe('Currency Formatting', () => {
    it('should format whole numbers correctly', async () => {
      const wholeNumberVoucher = {
        ...mockVoucherData,
        gross: 1000,
        has_tax_deduction: false
      };

      await generateVoucherPDF(wholeNumberVoucher);

      expect(mockText).toHaveBeenCalledWith('PHP 1 000,00', expect.any(Number), expect.any(Number), { align: "right" });
    });

    it('should format decimal numbers correctly', async () => {
      const decimalVoucher = {
        ...mockVoucherData,
        gross: 1234.56,
        has_tax_deduction: false
      };

      await generateVoucherPDF(decimalVoucher);

      expect(mockText).toHaveBeenCalledWith('PHP 1 234,56', expect.any(Number), expect.any(Number), { align: "right" });
    });

    it('should handle very large amounts', async () => {
      const largeAmountVoucher = {
        ...mockVoucherData,
        gross: 999999999.99,
        has_tax_deduction: false
      };

      await generateVoucherPDF(largeAmountVoucher);

      expect(mockText).toHaveBeenCalledWith('PHP 999 999 999,99', expect.any(Number), expect.any(Number), { align: "right" });
    });
  });

  describe('Number to Words Conversion', () => {
    it('should handle zero amount', async () => {
      const zeroVoucher = {
        ...mockVoucherData,
        gross: 0,
        has_tax_deduction: false
      };

      await generateVoucherPDF(zeroVoucher);

      // Should include "Zero Pesos" in the receipt text
      const receiptCalls = mockSplitTextToSize.mock.calls.filter(call =>
        call[0] && call[0].toString().includes('Zero Pesos')
      );
      expect(receiptCalls.length).toBeGreaterThan(0);
    });

    it('should handle amounts with cents', async () => {
      const centsVoucher = {
        ...mockVoucherData,
        gross: 100.75,
        has_tax_deduction: false
      };

      await generateVoucherPDF(centsVoucher);

      // Should include both pesos and centavos
      const receiptCalls = mockSplitTextToSize.mock.calls.filter(call =>
        call[0] && call[0].toString().includes('One Hundred Pesos and')
      );
      expect(receiptCalls.length).toBeGreaterThan(0);
    });

    it('should handle whole peso amounts without cents', async () => {
      const wholeVoucher = {
        ...mockVoucherData,
        gross: 100,
        has_tax_deduction: false
      };

      await generateVoucherPDF(wholeVoucher);

      const receiptCalls = mockSplitTextToSize.mock.calls.filter(call =>
        call[0] && call[0].toString().includes('One Hundred Pesos') &&
        !call[0].toString().includes('Centavos')
      );
      expect(receiptCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty or null values gracefully', async () => {
      const emptyDataVoucher: VoucherPDFData = {
        ...mockVoucherData,
        payee_name: '',
        payee_address: '',
        particulars: '',
        remarks: ''
      };

      await expect(generateVoucherPDF(emptyDataVoucher)).resolves.not.toThrow();
    });

    it('should handle very long text in particulars', async () => {
      const longTextVoucher = {
        ...mockVoucherData,
        particulars: 'This is a very long particulars text that should be handled properly by the PDF generator without causing any issues or layout problems in the final document output.'
      };

      await expect(generateVoucherPDF(longTextVoucher)).resolves.not.toThrow();
    });

    it('should handle special characters in text fields', async () => {
      const specialCharVoucher = {
        ...mockVoucherData,
        payee_name: 'José María Ñoño',
        payee_address: '123 Cañón St., Niño City',
        particulars: 'Honorário & consultação técnica'
      };

      await expect(generateVoucherPDF(specialCharVoucher)).resolves.not.toThrow();
    });

    it('should handle extreme dates', async () => {
      const futureDateVoucher = {
        ...mockVoucherData,
        date: '2099-12-31'
      };

      await generateVoucherPDF(futureDateVoucher);

      expect(mockText).toHaveBeenCalledWith('31-Dec-99', 167, 49);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of vouchers efficiently', async () => {
      const manyVouchers = Array.from({ length: 100 }, (_, index) => ({
        ...mockVoucherData,
        id: index + 1,
        dv_no: `DV${String(index + 1).padStart(3, '0')}`
      }));

      const startTime = performance.now();
      await generateMultipleVouchersPDF(manyVouchers, 'Performance Test');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete in less than 5 seconds
      expect(mockAddPage).toHaveBeenCalledTimes(99); // 99 additional pages for 100 vouchers
    });

    it('should not cause memory issues with large data', async () => {
      const largeDataVoucher = {
        ...mockVoucherData,
        particulars: 'A'.repeat(10000), // Very long particulars
        remarks: 'B'.repeat(5000) // Very long remarks
      };

      await expect(generateVoucherPDF(largeDataVoucher)).resolves.not.toThrow();
    });
  });
});

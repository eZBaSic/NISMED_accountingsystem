import { describe, it, expect } from 'vitest';

// Type validation tests
describe('Type Definitions', () => {
  describe('voucher_entry interface', () => {
    it('should have all required properties', () => {
      const voucher_entry: voucher_entry = {
        project_id: 'PROJ-001',
        dv_no: 'PROJ-001-25-001',
        name: 'John Doe',
        address: '123 Main St',
        date: '2025-08-10',
        gross: 5000,
        tax: true,
        particulars: 'Test expense',
        payment_mode: 'Cash',
        remarks: 'Test remarks'
      };

      expect(voucher_entry.project_id).toBe('PROJ-001');
      expect(voucher_entry.dv_no).toBe('PROJ-001-25-001');
      expect(voucher_entry.name).toBe('John Doe');
      expect(voucher_entry.address).toBe('123 Main St');
      expect(voucher_entry.date).toBe('2025-08-10');
      expect(voucher_entry.gross).toBe(5000);
      expect(voucher_entry.tax).toBe(true);
      expect(voucher_entry.particulars).toBe('Test expense');
      expect(voucher_entry.payment_mode).toBe('Cash');
      expect(voucher_entry.remarks).toBe('Test remarks');
    });
  });

  describe('voucher interface', () => {
    it('should have all required properties', () => {
      const voucher: voucher = {
        dv_no: 'PROJ-001-25-001',
        id: 1,
        payee_id: '1',
        project_id: '1',
        date: '2025-08-10',
        nth_yearly_voucher: 1,
        gross: 5000,
        has_tax_deduction: true,
        particulars: 'Test expense',
        payment_mode: 'Cash',
        remarks: 'Test remarks'
      };

      expect(voucher.dv_no).toBe('PROJ-001-25-001');
      expect(voucher.id).toBe(1);
      expect(voucher.payee_id).toBe('1');
      expect(voucher.project_id).toBe('1');
      expect(voucher.date).toBe('2025-08-10');
      expect(voucher.nth_yearly_voucher).toBe(1);
      expect(voucher.gross).toBe(5000);
      expect(voucher.has_tax_deduction).toBe(true);
      expect(voucher.particulars).toBe('Test expense');
      expect(voucher.payment_mode).toBe('Cash');
      expect(voucher.remarks).toBe('Test remarks');
    });
  });

  describe('payee interface', () => {
    it('should have all required properties', () => {
      const payee: payee = {
        name: 'John Doe',
        id: 1,
        address: '123 Main St',
        tin_id: '123-456-789'
      };

      expect(payee.name).toBe('John Doe');
      expect(payee.id).toBe(1);
      expect(payee.address).toBe('123 Main St');
      expect(payee.tin_id).toBe('123-456-789');
    });
  });

  describe('project interface', () => {
    it('should have all required properties', () => {
      const project: project = {
        code: 'PROJ-001',
        id: 1,
        title: 'Test Project',
        tax: 10,
        authorized_rep: 'Jane Smith',
        approver: 'Bob Johnson',
        admin_officer: 'Alice Brown'
      };

      expect(project.code).toBe('PROJ-001');
      expect(project.id).toBe(1);
      expect(project.title).toBe('Test Project');
      expect(project.tax).toBe(10);
      expect(project.authorized_rep).toBe('Jane Smith');
      expect(project.approver).toBe('Bob Johnson');
      expect(project.admin_officer).toBe('Alice Brown');
    });
  });
});

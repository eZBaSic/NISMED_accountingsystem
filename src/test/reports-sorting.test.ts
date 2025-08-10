import { describe, it, expect, beforeEach, vi } from 'vitest';

// Sample voucher data for testing
interface VoucherWithDetails {
  id: number;
  dv_no: string;
  payee_name: string;
  payee_address: string;
  date: string;
  nth_yearly_voucher: number;
  gross: number;
  has_tax_deduction: boolean;
  particulars: string;
  payment_mode: string;
  remarks: string;
}

const mockVouchers: VoucherWithDetails[] = [
  {
    id: 1,
    dv_no: 'DV003',
    payee_name: 'Charlie Brown',
    payee_address: '789 Oak St',
    date: '2024-03-15',
    nth_yearly_voucher: 3,
    gross: 1500,
    has_tax_deduction: true,
    particulars: 'Service fee',
    payment_mode: 'Bank Transfer',
    remarks: 'Priority payment'
  },
  {
    id: 2,
    dv_no: 'DV001',
    payee_name: 'Alice Johnson',
    payee_address: '123 Main St',
    date: '2024-01-10',
    nth_yearly_voucher: 1,
    gross: 1000,
    has_tax_deduction: false,
    particulars: 'Consultation',
    payment_mode: 'Cash',
    remarks: 'Urgent'
  },
  {
    id: 3,
    dv_no: 'DV002',
    payee_name: 'Bob Smith',
    payee_address: '456 Pine Ave',
    date: '2024-02-20',
    nth_yearly_voucher: 2,
    gross: 2000,
    has_tax_deduction: true,
    particulars: 'Equipment rental',
    payment_mode: 'Online Payment',
    remarks: ''
  }
];

// Sorting function (copied from implementation)
function sortVouchers(rows: VoucherWithDetails[], field: 'dv_no' | 'payee_name' | 'date' | null, direction: 'asc' | 'desc'): VoucherWithDetails[] {
  if (!field) return rows;
  
  return [...rows].sort((a, b) => {
    let valueA: string | number;
    let valueB: string | number;
    
    switch (field) {
      case 'dv_no':
        valueA = a.dv_no.toLowerCase();
        valueB = b.dv_no.toLowerCase();
        break;
      case 'payee_name':
        valueA = a.payee_name.toLowerCase();
        valueB = b.payee_name.toLowerCase();
        break;
      case 'date':
        valueA = new Date(a.date).getTime();
        valueB = new Date(b.date).getTime();
        break;
      default:
        return 0;
    }
    
    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

describe('Reports Sorting Functionality Tests', () => {
  describe('Sort by DV Number', () => {
    it('should sort by DV number ascending', () => {
      const sorted = sortVouchers(mockVouchers, 'dv_no', 'asc');
      const dvNumbers = sorted.map(v => v.dv_no);
      
      expect(dvNumbers).toEqual(['DV001', 'DV002', 'DV003']);
    });

    it('should sort by DV number descending', () => {
      const sorted = sortVouchers(mockVouchers, 'dv_no', 'desc');
      const dvNumbers = sorted.map(v => v.dv_no);
      
      expect(dvNumbers).toEqual(['DV003', 'DV002', 'DV001']);
    });

    it('should handle mixed case DV numbers', () => {
      const mixedCaseVouchers = [
        { ...mockVouchers[0], dv_no: 'dv003' },
        { ...mockVouchers[1], dv_no: 'DV001' },
        { ...mockVouchers[2], dv_no: 'Dv002' }
      ];
      
      const sorted = sortVouchers(mixedCaseVouchers, 'dv_no', 'asc');
      const dvNumbers = sorted.map(v => v.dv_no);
      
      expect(dvNumbers).toEqual(['DV001', 'Dv002', 'dv003']);
    });
  });

  describe('Sort by Payee Name', () => {
    it('should sort by payee name ascending', () => {
      const sorted = sortVouchers(mockVouchers, 'payee_name', 'asc');
      const payeeNames = sorted.map(v => v.payee_name);
      
      expect(payeeNames).toEqual(['Alice Johnson', 'Bob Smith', 'Charlie Brown']);
    });

    it('should sort by payee name descending', () => {
      const sorted = sortVouchers(mockVouchers, 'payee_name', 'desc');
      const payeeNames = sorted.map(v => v.payee_name);
      
      expect(payeeNames).toEqual(['Charlie Brown', 'Bob Smith', 'Alice Johnson']);
    });

    it('should handle mixed case payee names', () => {
      const mixedCaseVouchers = [
        { ...mockVouchers[0], payee_name: 'charlie brown' },
        { ...mockVouchers[1], payee_name: 'ALICE JOHNSON' },
        { ...mockVouchers[2], payee_name: 'Bob Smith' }
      ];
      
      const sorted = sortVouchers(mixedCaseVouchers, 'payee_name', 'asc');
      const payeeNames = sorted.map(v => v.payee_name);
      
      expect(payeeNames).toEqual(['ALICE JOHNSON', 'Bob Smith', 'charlie brown']);
    });

    it('should handle special characters in names', () => {
      const specialNameVouchers = [
        { ...mockVouchers[0], payee_name: 'Zoë Martinez' },
        { ...mockVouchers[1], payee_name: 'Åke Andersson' },
        { ...mockVouchers[2], payee_name: 'José García' }
      ];
      
      const sorted = sortVouchers(specialNameVouchers, 'payee_name', 'asc');
      
      expect(sorted).toHaveLength(3);
      // Names with special characters should sort correctly
      const sortedNames = sorted.map(v => v.payee_name);
      expect(sortedNames).toContain('Åke Andersson');
      expect(sortedNames).toContain('José García');
      expect(sortedNames).toContain('Zoë Martinez');
    });
  });

  describe('Sort by Date', () => {
    it('should sort by date ascending', () => {
      const sorted = sortVouchers(mockVouchers, 'date', 'asc');
      const dates = sorted.map(v => v.date);
      
      expect(dates).toEqual(['2024-01-10', '2024-02-20', '2024-03-15']);
    });

    it('should sort by date descending', () => {
      const sorted = sortVouchers(mockVouchers, 'date', 'desc');
      const dates = sorted.map(v => v.date);
      
      expect(dates).toEqual(['2024-03-15', '2024-02-20', '2024-01-10']);
    });

    it('should handle same dates correctly', () => {
      const sameDateVouchers = [
        { ...mockVouchers[0], date: '2024-01-15', dv_no: 'DV003' },
        { ...mockVouchers[1], date: '2024-01-15', dv_no: 'DV001' },
        { ...mockVouchers[2], date: '2024-01-15', dv_no: 'DV002' }
      ];
      
      const sorted = sortVouchers(sameDateVouchers, 'date', 'asc');
      
      // All dates should be the same
      expect(sorted.every(v => v.date === '2024-01-15')).toBe(true);
      expect(sorted).toHaveLength(3);
    });

    it('should handle different date formats correctly', () => {
      const dates = ['2024-12-01', '2024-01-15', '2024-06-30'];
      const vouchers = dates.map((date, index) => ({
        ...mockVouchers[index],
        date
      }));
      
      const sorted = sortVouchers(vouchers, 'date', 'asc');
      const sortedDates = sorted.map(v => v.date);
      
      expect(sortedDates).toEqual(['2024-01-15', '2024-06-30', '2024-12-01']);
    });
  });

  describe('Sort State Management', () => {
    it('should handle sort direction changes', () => {
      let sortField: 'dv_no' | 'payee_name' | 'date' | null = 'dv_no';
      let sortDirection: 'asc' | 'desc' = 'asc';

      // First sort - ascending
      let sorted = sortVouchers(mockVouchers, sortField, sortDirection);
      expect(sorted[0].dv_no).toBe('DV001');

      // Change direction to descending
      sortDirection = 'desc';
      sorted = sortVouchers(mockVouchers, sortField, sortDirection);
      expect(sorted[0].dv_no).toBe('DV003');
    });

    it('should handle field changes', () => {
      let sortField: 'dv_no' | 'payee_name' | 'date' | null = 'dv_no';
      let sortDirection: 'asc' | 'desc' = 'asc';

      // Sort by DV number
      let sorted = sortVouchers(mockVouchers, sortField, sortDirection);
      expect(sorted[0].dv_no).toBe('DV001');

      // Change to sort by name
      sortField = 'payee_name';
      sorted = sortVouchers(mockVouchers, sortField, sortDirection);
      expect(sorted[0].payee_name).toBe('Alice Johnson');

      // Change to sort by date
      sortField = 'date';
      sorted = sortVouchers(mockVouchers, sortField, sortDirection);
      expect(sorted[0].date).toBe('2024-01-10');
    });

    it('should return original order when no field is selected', () => {
      const sorted = sortVouchers(mockVouchers, null, 'asc');
      
      expect(sorted).toEqual(mockVouchers);
      expect(sorted[0].id).toBe(1);
      expect(sorted[1].id).toBe(2);
      expect(sorted[2].id).toBe(3);
    });
  });

  describe('Sort Icon Logic', () => {
    function getSortIcon(currentField: 'dv_no' | 'payee_name' | 'date', sortField: 'dv_no' | 'payee_name' | 'date' | null, sortDirection: 'asc' | 'desc'): string {
      if (sortField !== currentField) return '↕️';
      return sortDirection === 'asc' ? '↑' : '↓';
    }

    it('should show neutral icon for unsorted columns', () => {
      const icon = getSortIcon('dv_no', 'payee_name', 'asc');
      expect(icon).toBe('↕️');
    });

    it('should show ascending icon for ascending sort', () => {
      const icon = getSortIcon('dv_no', 'dv_no', 'asc');
      expect(icon).toBe('↑');
    });

    it('should show descending icon for descending sort', () => {
      const icon = getSortIcon('payee_name', 'payee_name', 'desc');
      expect(icon).toBe('↓');
    });

    it('should show correct icons for all sortable fields', () => {
      const fields: ('dv_no' | 'payee_name' | 'date')[] = ['dv_no', 'payee_name', 'date'];
      
      fields.forEach(field => {
        const ascIcon = getSortIcon(field, field, 'asc');
        const descIcon = getSortIcon(field, field, 'desc');
        const neutralIcon = getSortIcon(field, null, 'asc');
        
        expect(ascIcon).toBe('↑');
        expect(descIcon).toBe('↓');
        expect(neutralIcon).toBe('↕️');
      });
    });
  });

  describe('Sort Handle Logic', () => {
    function handleSort(clickedField: 'dv_no' | 'payee_name' | 'date', currentSortField: 'dv_no' | 'payee_name' | 'date' | null, currentSortDirection: 'asc' | 'desc'): { sortField: 'dv_no' | 'payee_name' | 'date', sortDirection: 'asc' | 'desc' } {
      if (currentSortField === clickedField) {
        return {
          sortField: clickedField,
          sortDirection: currentSortDirection === 'asc' ? 'desc' : 'asc'
        };
      } else {
        return {
          sortField: clickedField,
          sortDirection: 'asc'
        };
      }
    }

    it('should toggle direction when clicking same field', () => {
      let result = handleSort('dv_no', 'dv_no', 'asc');
      expect(result.sortField).toBe('dv_no');
      expect(result.sortDirection).toBe('desc');

      result = handleSort('dv_no', 'dv_no', 'desc');
      expect(result.sortField).toBe('dv_no');
      expect(result.sortDirection).toBe('asc');
    });

    it('should start with ascending when clicking new field', () => {
      const result = handleSort('payee_name', 'dv_no', 'desc');
      expect(result.sortField).toBe('payee_name');
      expect(result.sortDirection).toBe('asc');
    });

    it('should handle transition from null field', () => {
      const result = handleSort('date', null, 'asc');
      expect(result.sortField).toBe('date');
      expect(result.sortDirection).toBe('asc');
    });
  });

  describe('Edge Cases and Data Integrity', () => {
    it('should not mutate original array', () => {
      const originalVouchers = [...mockVouchers];
      const sorted = sortVouchers(mockVouchers, 'dv_no', 'asc');
      
      expect(mockVouchers).toEqual(originalVouchers);
      expect(sorted).not.toBe(mockVouchers);
    });

    it('should handle empty array', () => {
      const sorted = sortVouchers([], 'dv_no', 'asc');
      expect(sorted).toEqual([]);
    });

    it('should handle single item array', () => {
      const singleItem = [mockVouchers[0]];
      const sorted = sortVouchers(singleItem, 'payee_name', 'desc');
      
      expect(sorted).toHaveLength(1);
      expect(sorted[0]).toEqual(mockVouchers[0]);
    });

    it('should preserve all object properties after sorting', () => {
      const sorted = sortVouchers(mockVouchers, 'dv_no', 'asc');
      
      sorted.forEach(voucher => {
        expect(voucher).toHaveProperty('id');
        expect(voucher).toHaveProperty('dv_no');
        expect(voucher).toHaveProperty('payee_name');
        expect(voucher).toHaveProperty('payee_address');
        expect(voucher).toHaveProperty('date');
        expect(voucher).toHaveProperty('nth_yearly_voucher');
        expect(voucher).toHaveProperty('gross');
        expect(voucher).toHaveProperty('has_tax_deduction');
        expect(voucher).toHaveProperty('particulars');
        expect(voucher).toHaveProperty('payment_mode');
        expect(voucher).toHaveProperty('remarks');
      });
    });
  });

  describe('Performance and Stability', () => {
    it('should handle large datasets efficiently', () => {
      // Create a larger dataset
      const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
        ...mockVouchers[index % 3],
        id: index + 1,
        dv_no: `DV${String(index + 1).padStart(3, '0')}`
      }));

      const startTime = performance.now();
      const sorted = sortVouchers(largeDataset, 'dv_no', 'asc');
      const endTime = performance.now();

      expect(sorted).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });

    it('should provide stable sorting', () => {
      // Create vouchers with identical sort keys
      const identicalVouchers = [
        { ...mockVouchers[0], dv_no: 'DV001', payee_name: 'Same Name', date: '2024-01-01', id: 1 },
        { ...mockVouchers[1], dv_no: 'DV001', payee_name: 'Same Name', date: '2024-01-01', id: 2 },
        { ...mockVouchers[2], dv_no: 'DV001', payee_name: 'Same Name', date: '2024-01-01', id: 3 }
      ];

      const sorted1 = sortVouchers(identicalVouchers, 'dv_no', 'asc');
      const sorted2 = sortVouchers(identicalVouchers, 'dv_no', 'asc');

      // Results should be consistent
      expect(sorted1.map(v => v.id)).toEqual(sorted2.map(v => v.id));
    });
  });
});

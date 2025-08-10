import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Vouchers Sorting Functionality Tests', () => {
  // Mock voucher data for testing
  const mockVoucherRows: voucher_entry[] = [
    {
      project_id: 'PROJ-001',
      dv_no: 'PROJ-001-25-003',
      name: 'Charlie Brown',
      address: '789 Oak St',
      date: '2025-08-12',
      gross: 3000,
      tax: false,
      particulars: 'Office supplies',
      payment_mode: 'Cash',
      remarks: 'Urgent'
    },
    {
      project_id: 'PROJ-001',
      dv_no: 'PROJ-001-25-001',
      name: 'Alice Johnson',
      address: '123 Main St',
      date: '2025-08-10',
      gross: 5000,
      tax: true,
      particulars: 'Consulting fee',
      payment_mode: 'Bank Transfer',
      remarks: 'Monthly payment'
    },
    {
      project_id: 'PROJ-001',
      dv_no: 'PROJ-001-25-002',
      name: 'Bob Smith',
      address: '456 Elm St',
      date: '2025-08-11',
      gross: 2500,
      tax: false,
      particulars: 'Equipment rental',
      payment_mode: 'Online Payment',
      remarks: 'Weekly rental'
    }
  ];

  // Sorting function to test (extracted from component logic)
  function sortVoucherRows(rows: voucher_entry[], field: SortField, direction: SortDirection): voucher_entry[] {
    if (!field) return rows;
    
    return [...rows].sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;
      
      switch (field) {
        case 'dv_no':
          valueA = a.dv_no.toLowerCase();
          valueB = b.dv_no.toLowerCase();
          break;
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
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

  describe('Sort by DV Number', () => {
    it('should sort by DV number in ascending order', () => {
      const sorted = sortVoucherRows(mockVoucherRows, 'dv_no', 'asc');
      
      expect(sorted[0].dv_no).toBe('PROJ-001-25-001');
      expect(sorted[1].dv_no).toBe('PROJ-001-25-002');
      expect(sorted[2].dv_no).toBe('PROJ-001-25-003');
    });

    it('should sort by DV number in descending order', () => {
      const sorted = sortVoucherRows(mockVoucherRows, 'dv_no', 'desc');
      
      expect(sorted[0].dv_no).toBe('PROJ-001-25-003');
      expect(sorted[1].dv_no).toBe('PROJ-001-25-002');
      expect(sorted[2].dv_no).toBe('PROJ-001-25-001');
    });

    it('should handle case insensitive DV number sorting', () => {
      const mixedCaseRows: voucher_entry[] = [
        { ...mockVoucherRows[0], dv_no: 'proj-001-25-003' },
        { ...mockVoucherRows[1], dv_no: 'PROJ-001-25-001' },
        { ...mockVoucherRows[2], dv_no: 'Proj-001-25-002' }
      ];
      
      const sorted = sortVoucherRows(mixedCaseRows, 'dv_no', 'asc');
      
      expect(sorted[0].dv_no.toLowerCase()).toBe('proj-001-25-001');
      expect(sorted[1].dv_no.toLowerCase()).toBe('proj-001-25-002');
      expect(sorted[2].dv_no.toLowerCase()).toBe('proj-001-25-003');
    });
  });

  describe('Sort by Name', () => {
    it('should sort by name in ascending order', () => {
      const sorted = sortVoucherRows(mockVoucherRows, 'name', 'asc');
      
      expect(sorted[0].name).toBe('Alice Johnson');
      expect(sorted[1].name).toBe('Bob Smith');
      expect(sorted[2].name).toBe('Charlie Brown');
    });

    it('should sort by name in descending order', () => {
      const sorted = sortVoucherRows(mockVoucherRows, 'name', 'desc');
      
      expect(sorted[0].name).toBe('Charlie Brown');
      expect(sorted[1].name).toBe('Bob Smith');
      expect(sorted[2].name).toBe('Alice Johnson');
    });

    it('should handle case insensitive name sorting', () => {
      const mixedCaseRows: voucher_entry[] = [
        { ...mockVoucherRows[0], name: 'charlie brown' },
        { ...mockVoucherRows[1], name: 'ALICE JOHNSON' },
        { ...mockVoucherRows[2], name: 'Bob Smith' }
      ];
      
      const sorted = sortVoucherRows(mixedCaseRows, 'name', 'asc');
      
      expect(sorted[0].name.toLowerCase()).toBe('alice johnson');
      expect(sorted[1].name.toLowerCase()).toBe('bob smith');
      expect(sorted[2].name.toLowerCase()).toBe('charlie brown');
    });
  });

  describe('Sort by Date', () => {
    it('should sort by date in ascending order (oldest first)', () => {
      const sorted = sortVoucherRows(mockVoucherRows, 'date', 'asc');
      
      expect(sorted[0].date).toBe('2025-08-10');
      expect(sorted[1].date).toBe('2025-08-11');
      expect(sorted[2].date).toBe('2025-08-12');
    });

    it('should sort by date in descending order (newest first)', () => {
      const sorted = sortVoucherRows(mockVoucherRows, 'date', 'desc');
      
      expect(sorted[0].date).toBe('2025-08-12');
      expect(sorted[1].date).toBe('2025-08-11');
      expect(sorted[2].date).toBe('2025-08-10');
    });

    it('should handle same dates correctly', () => {
      const sameDateRows: voucher_entry[] = [
        { ...mockVoucherRows[0], date: '2025-08-10', name: 'Charlie Brown' },
        { ...mockVoucherRows[1], date: '2025-08-10', name: 'Alice Johnson' },
        { ...mockVoucherRows[2], date: '2025-08-11', name: 'Bob Smith' }
      ];
      
      const sorted = sortVoucherRows(sameDateRows, 'date', 'asc');
      
      // First two should have same date (2025-08-10), third should be 2025-08-11
      expect(sorted[0].date).toBe('2025-08-10');
      expect(sorted[1].date).toBe('2025-08-10');
      expect(sorted[2].date).toBe('2025-08-11');
    });
  });

  describe('No Sort (Null Field)', () => {
    it('should return original order when sort field is null', () => {
      const sorted = sortVoucherRows(mockVoucherRows, null, 'asc');
      
      expect(sorted).toEqual(mockVoucherRows);
      expect(sorted[0].name).toBe('Charlie Brown');
      expect(sorted[1].name).toBe('Alice Johnson');
      expect(sorted[2].name).toBe('Bob Smith');
    });

    it('should not mutate original array when sorting is disabled', () => {
      const originalRows = [...mockVoucherRows];
      const sorted = sortVoucherRows(mockVoucherRows, null, 'asc');
      
      expect(mockVoucherRows).toEqual(originalRows);
      // When sorting is disabled, the function returns the same array reference
      // This is actually expected behavior for performance reasons
      expect(sorted).toBe(mockVoucherRows); 
    });
  });

  describe('Sort Icon Logic', () => {
    function getSortIcon(field: 'dv_no' | 'name' | 'date', sortField: SortField, sortDirection: SortDirection): string {
      if (sortField !== field) return '↕️';
      return sortDirection === 'asc' ? '↑' : '↓';
    }

    it('should show neutral icon when field is not selected', () => {
      expect(getSortIcon('dv_no', 'name', 'asc')).toBe('↕️');
      expect(getSortIcon('name', 'date', 'desc')).toBe('↕️');
      expect(getSortIcon('date', null, 'asc')).toBe('↕️');
    });

    it('should show up arrow for ascending sort', () => {
      expect(getSortIcon('dv_no', 'dv_no', 'asc')).toBe('↑');
      expect(getSortIcon('name', 'name', 'asc')).toBe('↑');
      expect(getSortIcon('date', 'date', 'asc')).toBe('↑');
    });

    it('should show down arrow for descending sort', () => {
      expect(getSortIcon('dv_no', 'dv_no', 'desc')).toBe('↓');
      expect(getSortIcon('name', 'name', 'desc')).toBe('↓');
      expect(getSortIcon('date', 'date', 'desc')).toBe('↓');
    });
  });

  describe('Sort State Management', () => {
    it('should toggle direction when same field is clicked', () => {
      let sortField: SortField = 'name';
      let sortDirection: SortDirection = 'asc';

      // Simulate clicking the same field
      function handleSort(field: 'dv_no' | 'name' | 'date') {
        if (sortField === field) {
          sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          sortField = field;
          sortDirection = 'asc';
        }
      }

      handleSort('name');
      expect(sortDirection).toBe('desc');
      
      handleSort('name');
      expect(sortDirection).toBe('asc');
    });

    it('should set new field and reset to ascending when different field is clicked', () => {
      let sortField: SortField = 'name';
      let sortDirection: SortDirection = 'desc';

      function handleSort(field: 'dv_no' | 'name' | 'date') {
        if (sortField === field) {
          sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          sortField = field;
          sortDirection = 'asc';
        }
      }

      handleSort('dv_no');
      expect(sortField).toBe('dv_no');
      expect(sortDirection).toBe('asc');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array', () => {
      const sorted = sortVoucherRows([], 'name', 'asc');
      expect(sorted).toEqual([]);
    });

    it('should handle single item array', () => {
      const singleItem = [mockVoucherRows[0]];
      const sorted = sortVoucherRows(singleItem, 'name', 'asc');
      expect(sorted).toEqual(singleItem);
    });

    it('should handle invalid dates gracefully', () => {
      const invalidDateRows: voucher_entry[] = [
        { ...mockVoucherRows[0], date: 'invalid-date' },
        { ...mockVoucherRows[1], date: '2025-08-10' }
      ];
      
      // Should not throw error
      expect(() => {
        sortVoucherRows(invalidDateRows, 'date', 'asc');
      }).not.toThrow();
    });

    it('should preserve non-sorted properties during sort', () => {
      const sorted = sortVoucherRows(mockVoucherRows, 'name', 'asc');
      
      // Check that all properties are preserved
      sorted.forEach(row => {
        expect(row).toHaveProperty('project_id');
        expect(row).toHaveProperty('dv_no');
        expect(row).toHaveProperty('gross');
        expect(row).toHaveProperty('tax');
        expect(row).toHaveProperty('particulars');
        expect(row).toHaveProperty('payment_mode');
        expect(row).toHaveProperty('remarks');
      });
    });
  });
});

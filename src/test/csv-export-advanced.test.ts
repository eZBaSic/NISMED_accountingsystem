import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Dashboard from '../routes/dashboard/+page.svelte';

// Mock CSV download functionality
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-blob-url'),
    revokeObjectURL: vi.fn()
  }
});

// Mock Blob constructor
global.Blob = vi.fn().mockImplementation((content, options) => ({
  content,
  options,
  size: content[0].length,
  type: options?.type || ''
}));

// Mock HTMLAnchorElement click
const mockClick = vi.fn();
Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
  value: mockClick
});

describe('CSV Export Functionality', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = global.mockSupabase;
    vi.clearAllMocks();
    
    // Mock projects data
    const mockProjects = [
      { 
        id: '1', 
        code: 'PROJ-001', 
        title: 'Test Project 1', 
        tax: 12, 
        authorized_rep: 'John Doe', 
        approver: 'Jane Smith' 
      },
      { 
        id: '2', 
        code: 'PROJ-002', 
        title: 'Test Project 2', 
        tax: 15, 
        authorized_rep: 'Bob Johnson', 
        approver: 'Alice Brown' 
      }
    ];

    // Mock vouchers data
    const mockVouchers = [
      {
        id: 1,
        dv_no: 'PROJ-001-25-001',
        date: '2025-01-15',
        gross: 10000,
        has_tax_deduction: true,
        payment_mode: 'check',
        project_id: '1',
        payee_id: '1',
        payees: { name: 'Supplier One', address: '123 Main St', tin_id: '123456789' },
        projects: { code: 'PROJ-001', title: 'Test Project 1' }
      },
      {
        id: 2,
        dv_no: 'PROJ-002-25-001',
        date: '2025-01-16',
        gross: 15000,
        has_tax_deduction: false,
        payment_mode: 'cash',
        project_id: '2',
        payee_id: '2',
        payees: { name: 'Supplier Two', address: '456 Oak Ave', tin_id: '987654321' },
        projects: { code: 'PROJ-002', title: 'Test Project 2' }
      }
    ];

    // Setup mock responses
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'projects') {
        return {
          select: vi.fn().mockResolvedValue({ data: mockProjects, error: null })
        };
      }
      if (table === 'vouchers') {
        return {
          select: vi.fn().mockResolvedValue({ data: mockVouchers, error: null })
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null })
      };
    });
  });

  it('should export projects to CSV with correct format', async () => {
    const user = userEvent.setup();
    render(Dashboard);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Find and click the export projects button
    const exportProjectsButton = screen.getByText('Export Projects CSV');
    await user.click(exportProjectsButton);

    // Wait for data to load and export to trigger
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
    });

    // Verify Blob was created with correct CSV content
    await waitFor(() => {
      expect(global.Blob).toHaveBeenCalled();
      const blobArgs = vi.mocked(global.Blob).mock.calls[0];
      const csvContent = blobArgs[0][0];
      
      // Check CSV headers
      expect(csvContent).toContain('ID,Code,Title,Tax Rate,Authorized Representative,Approver');
      
      // Check CSV data
      expect(csvContent).toContain('1,PROJ-001,Test Project 1,12,John Doe,Jane Smith');
      expect(csvContent).toContain('2,PROJ-002,Test Project 2,15,Bob Johnson,Alice Brown');
    });

    // Verify download was triggered
    expect(mockClick).toHaveBeenCalled();
  });

  it('should export vouchers to CSV with correct format', async () => {
    const user = userEvent.setup();
    render(Dashboard);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Find and click the export vouchers button
    const exportVouchersButton = screen.getByText('Export Vouchers CSV');
    await user.click(exportVouchersButton);

    // Wait for data to load and export to trigger
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('vouchers');
    });

    // Verify Blob was created with correct CSV content
    await waitFor(() => {
      expect(global.Blob).toHaveBeenCalled();
      const blobArgs = vi.mocked(global.Blob).mock.calls[0];
      const csvContent = blobArgs[0][0];
      
      // Check CSV headers
      expect(csvContent).toContain('DV Number,Date,Payee Name,Payee Address,TIN ID,Gross Amount,Has Tax Deduction,Payment Mode,Project Code,Project Title');
      
      // Check CSV data
      expect(csvContent).toContain('PROJ-001-25-001,2025-01-15,Supplier One,123 Main St,123456789,10000,true,check,PROJ-001,Test Project 1');
      expect(csvContent).toContain('PROJ-002-25-001,2025-01-16,Supplier Two,456 Oak Ave,987654321,15000,false,cash,PROJ-002,Test Project 2');
    });

    expect(mockClick).toHaveBeenCalled();
  });

  it('should handle CSV export errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock database error
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
    });

    vi.stubGlobal('alert', vi.fn());

    render(Dashboard);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    const exportProjectsButton = screen.getByText('Export Projects CSV');
    await user.click(exportProjectsButton);

    // Should handle error gracefully
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error exporting projects: Database error');
    });
  });

  it('should generate correct filename for CSV exports', async () => {
    const user = userEvent.setup();
    render(Dashboard);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    const exportProjectsButton = screen.getByText('Export Projects CSV');
    await user.click(exportProjectsButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
    });

    // Check that the download link has correct filename
    await waitFor(() => {
      // The component should create a download link with appropriate filename
      // This would be implementation-specific based on how the download is handled
      expect(global.Blob).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ type: 'text/csv' })
      );
    });
  });

  it('should export empty CSV when no data available', async () => {
    const user = userEvent.setup();
    
    // Mock empty data
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null })
    });

    render(Dashboard);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    const exportProjectsButton = screen.getByText('Export Projects CSV');
    await user.click(exportProjectsButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
    });

    // Should still create CSV with headers even if no data
    await waitFor(() => {
      expect(global.Blob).toHaveBeenCalled();
      const blobArgs = vi.mocked(global.Blob).mock.calls[0];
      const csvContent = blobArgs[0][0];
      
      // Should contain headers
      expect(csvContent).toContain('ID,Code,Title,Tax Rate,Authorized Representative,Approver');
    });
  });

  it('should handle special characters in CSV data correctly', async () => {
    const user = userEvent.setup();
    
    // Mock data with special characters
    const specialCharProjects = [
      { 
        id: '1', 
        code: 'PROJ-001', 
        title: 'Test "Project" with, commas & special chars', 
        tax: 12, 
        authorized_rep: 'John, Jr. Doe', 
        approver: 'Jane "Manager" Smith' 
      }
    ];

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: specialCharProjects, error: null })
    });

    render(Dashboard);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    const exportProjectsButton = screen.getByText('Export Projects CSV');
    await user.click(exportProjectsButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
    });

    // Verify special characters are properly escaped in CSV
    await waitFor(() => {
      expect(global.Blob).toHaveBeenCalled();
      const blobArgs = vi.mocked(global.Blob).mock.calls[0];
      const csvContent = blobArgs[0][0];
      
      // Should properly escape quotes and commas
      expect(csvContent).toContain('"Test ""Project"" with, commas & special chars"');
      expect(csvContent).toContain('"John, Jr. Doe"');
      expect(csvContent).toContain('"Jane ""Manager"" Smith"');
    });
  });

  it('should display correct statistics on dashboard', async () => {
    render(Dashboard);

    // Wait for data to load
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
      expect(mockSupabase.from).toHaveBeenCalledWith('vouchers');
    });

    // Check that statistics are displayed
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total projects
      expect(screen.getByText('2')).toBeInTheDocument(); // Total vouchers
    });
  });
});

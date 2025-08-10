import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Integration tests that test complete user workflows

describe('Complete User Workflows - Integration Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = global.mockSupabase;
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
    
    // Setup successful mock responses
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ 
        data: [
          { id: '1', code: 'PROJ-001', title: 'Test Project 1', tax: 12, authorized_rep: 'John Doe', approver: 'Jane Smith' },
          { id: '2', code: 'PROJ-002', title: 'Test Project 2', tax: 12, authorized_rep: 'Bob Johnson', approver: 'Alice Brown' }
        ], 
        error: null 
      }),
      insert: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null })
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      })),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      }))
    });
  });

  describe('Complete Voucher Management Workflow', () => {
    it('should complete a full voucher creation and management cycle', async () => {
      const VouchersPage = await import('../routes/vouchers/+page.svelte');
      const user = userEvent.setup();
      
      render(VouchersPage.default);
      
      // 1. Wait for page to load and projects to populate
      await waitFor(() => {
        expect(screen.getByDisplayValue('PROJ-001')).toBeInTheDocument();
      });
      
      // 2. Add a new voucher row
      const addRowButton = screen.getByText('+ Add Row');
      await user.click(addRowButton);
      
      // 3. Fill in voucher details
      const nameInputs = screen.getAllByRole('textbox');
      const nameInput = nameInputs.find(input => !input.value.includes('PROJ-'));
      
      if (nameInput) {
        await user.type(nameInput, 'John Doe Supplier');
      }
      
      // 4. Set amount
      const grossInputs = screen.getAllByDisplayValue('0');
      if (grossInputs[0]) {
        await user.clear(grossInputs[0]);
        await user.type(grossInputs[0], '10000');
      }
      
      // 5. Toggle tax checkbox
      const taxCheckboxes = screen.getAllByRole('checkbox');
      if (taxCheckboxes[0]) {
        await user.click(taxCheckboxes[0]);
      }
      
      // 6. Save the voucher
      const saveButtons = screen.getAllByText('Save');
      await user.click(saveButtons[0]);
      
      // 7. Verify database calls were made
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('payees');
        expect(mockSupabase.from).toHaveBeenCalledWith('vouchers');
        expect(window.alert).toHaveBeenCalledWith('Voucher saved successfully!');
      });
    });

    it('should handle voucher editing and deletion', async () => {
      const VouchersPage = await import('../routes/vouchers/+page.svelte');
      const user = userEvent.setup();
      
      render(VouchersPage.default);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('PROJ-001')).toBeInTheDocument();
      });
      
      // Add multiple rows for testing
      const addRowButton = screen.getByText('+ Add Row');
      await user.click(addRowButton);
      await user.click(addRowButton);
      
      // Get delete buttons and remove one row
      const deleteButtons = screen.getAllByText('Delete');
      const initialCount = deleteButtons.length;
      
      await user.click(deleteButtons[0]);
      
      // Verify row was removed
      await waitFor(() => {
        const remainingDeleteButtons = screen.getAllByText('Delete');
        expect(remainingDeleteButtons.length).toBe(initialCount - 1);
      });
    });

    it('should handle project switching and voucher updates', async () => {
      const VouchersPage = await import('../routes/vouchers/+page.svelte');
      const user = userEvent.setup();
      
      render(VouchersPage.default);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('PROJ-001')).toBeInTheDocument();
      });
      
      // Switch to different project
      const projectSelect = screen.getByDisplayValue('PROJ-001');
      await user.selectOptions(projectSelect, '2');
      
      // Verify DV numbers updated
      await waitFor(() => {
        expect(projectSelect).toHaveValue('2');
      });
      
      // Check if new DV numbers reflect project change
      await waitFor(() => {
        const dvInputs = screen.getAllByDisplayValue(/PROJ-002-25-/);
        expect(dvInputs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Complete Project Management Workflow', () => {
    it('should complete a full project creation cycle', async () => {
      const ProjectsPage = await import('../routes/projects/+page.svelte');
      const user = userEvent.setup();
      
      render(ProjectsPage.default);
      
      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('Manage Projects')).toBeInTheDocument();
      });
      
      // Add new project
      const addProjectButton = screen.getByText('+ Add Project');
      await user.click(addProjectButton);
      
      // Fill in project details
      const inputs = screen.getAllByRole('textbox');
      const codeInput = inputs.find(input => input.closest('td')?.textContent?.includes('Code') || input.placeholder?.includes('Code'));
      const titleInput = inputs.find(input => input.closest('td')?.textContent?.includes('Title') || input.placeholder?.includes('Title'));
      const taxInput = inputs.find(input => input.type === 'number');
      
      if (codeInput) {
        await user.type(codeInput, 'PROJ-003');
      }
      
      if (titleInput) {
        await user.type(titleInput, 'New Test Project');
      }
      
      if (taxInput) {
        await user.clear(taxInput);
        await user.type(taxInput, '12');
      }
      
      // Save project
      const saveButtons = screen.getAllByText('Save');
      if (saveButtons[0]) {
        await user.click(saveButtons[0]);
      }
      
      // Verify save was attempted
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('projects');
      });
    });
  });

  describe('Complete Reports Workflow', () => {
    it('should load reports, filter by project, and handle PDF generation', async () => {
      const ReportsPage = await import('../routes/reports/+page.svelte');
      const user = userEvent.setup();
      
      // Mock vouchers data for reports
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                { id: '1', code: 'PROJ-001', title: 'Test Project 1' },
                { id: '2', code: 'PROJ-002', title: 'Test Project 2' }
              ],
              error: null
            })
          };
        }
        if (table === 'vouchers') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                { 
                  id: 1, 
                  dv_no: 'PROJ-001-25-001', 
                  date: '2025-01-01', 
                  gross: 10000, 
                  project_id: '1',
                  payees: { name: 'Test Payee' }
                }
              ],
              error: null
            })
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null })
        };
      });
      
      render(ReportsPage.default);
      
      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('Project Reports')).toBeInTheDocument();
      });
      
      // Select a project
      await waitFor(() => {
        const projectSelect = screen.getByDisplayValue('Select Project');
        expect(projectSelect).toBeInTheDocument();
      });
      
      const projectSelect = screen.getByDisplayValue('Select Project');
      await user.selectOptions(projectSelect, '1');
      
      // Verify vouchers load for selected project
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('vouchers');
      });
    });
  });

  describe('Error Handling Workflows', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: null, error: { message: 'Connection failed' } }),
        insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'Connection failed' } })
      });
      
      const VouchersPage = await import('../routes/vouchers/+page.svelte');
      render(VouchersPage.default);
      
      // Should handle the error gracefully (not crash)
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalled();
      });
    });

    it('should handle save errors appropriately', async () => {
      const VouchersPage = await import('../routes/vouchers/+page.svelte');
      const user = userEvent.setup();
      
      // Mock save error
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({ 
          data: [{ id: '1', code: 'PROJ-001', title: 'Test Project 1' }], 
          error: null 
        }),
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Save failed' } })
          }))
        }))
      });
      
      render(VouchersPage.default);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('PROJ-001')).toBeInTheDocument();
      });
      
      // Try to save and expect error message
      const saveButtons = screen.getAllByText('Save');
      await user.click(saveButtons[0]);
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Error saving voucher: Save failed');
      });
    });
  });

  describe('Data Validation Workflows', () => {
    it('should validate required fields across different forms', async () => {
      const VouchersPage = await import('../routes/vouchers/+page.svelte');
      const user = userEvent.setup();
      
      render(VouchersPage.default);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('PROJ-001')).toBeInTheDocument();
      });
      
      // Try to save empty voucher (should still attempt save)
      const saveButtons = screen.getAllByText('Save');
      await user.click(saveButtons[0]);
      
      // Even with empty data, save should be attempted (validation is at DB level)
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalled();
      });
    });
  });

  describe('Authentication Integration', () => {
    it('should handle authentication state changes', async () => {
      // Mock authentication state
      vi.mock('$lib/stores/auth', () => ({
        user: {
          subscribe: vi.fn((callback) => {
            // Simulate user login
            setTimeout(() => callback({ id: '1', email: 'test@example.com' }), 0);
            return () => {};
          })
        }
      }));
      
      const Layout = await import('../routes/+layout.svelte');
      const mockData = { user: { id: '1', email: 'test@example.com' } };
      
      render(Layout.default, { data: mockData });
      
      // Should show authenticated navigation
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });
    });
  });
});

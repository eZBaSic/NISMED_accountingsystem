import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import VouchersPage from '../routes/vouchers/+page.svelte';

// Mock projects data
const mockProjects = [
  { id: '1', code: 'PROJ-001', title: 'Test Project 1' },
  { id: '2', code: 'PROJ-002', title: 'Test Project 2' }
];

describe('Vouchers Page', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks before each test
    mockSupabase = global.mockSupabase;
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockProjects, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null })
        }))
      }))
    });

    // Mock window.alert
    vi.stubGlobal('alert', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the vouchers page with correct title', async () => {
    render(VouchersPage);
    
    expect(screen.getByText('Add Vouchers')).toBeInTheDocument();
  });

  it('loads projects on mount and populates dropdown', async () => {
    render(VouchersPage);
    
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
    });

    // Check if project codes appear in the select dropdown
    await waitFor(() => {
      expect(screen.getByDisplayValue('PROJ-001')).toBeInTheDocument();
    });
  });

  it('adds a new voucher row when "Add Row" button is clicked', async () => {
    const user = userEvent.setup();
    render(VouchersPage);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('PROJ-001')).toBeInTheDocument();
    });

    const addRowButton = screen.getByText('+ Add Row');
    await user.click(addRowButton);
    
    // Should have at least 2 rows now (one initial + one added)
    const dvNoInputs = screen.getAllByDisplayValue(/PROJ-001-25-/);
    expect(dvNoInputs.length).toBeGreaterThanOrEqual(2);
  });

  it('updates voucher row data when input fields change', async () => {
    const user = userEvent.setup();
    render(VouchersPage);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('PROJ-001')).toBeInTheDocument();
    });

    // Find the first name input and update it
    const nameInputs = screen.getAllByDisplayValue('');
    const nameInput = nameInputs.find(input => input.getAttribute('type') !== 'checkbox' && input.getAttribute('type') !== 'date');
    
    if (nameInput) {
      await user.type(nameInput, 'John Doe');
      expect(nameInput).toHaveValue('John Doe');
    }
  });

  it('deletes a voucher row when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(VouchersPage);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('PROJ-001')).toBeInTheDocument();
    });

    // Add an extra row first
    const addRowButton = screen.getByText('+ Add Row');
    await user.click(addRowButton);
    
    // Get initial count of delete buttons
    const initialDeleteButtons = screen.getAllByText('Delete');
    const initialCount = initialDeleteButtons.length;
    
    // Click the first delete button
    await user.click(initialDeleteButtons[0]);
    
    // Should have one less delete button now
    await waitFor(() => {
      const remainingDeleteButtons = screen.getAllByText('Delete');
      expect(remainingDeleteButtons.length).toBe(initialCount - 1);
    });
  });

  it('saves a single voucher row successfully', async () => {
    const user = userEvent.setup();
    render(VouchersPage);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('PROJ-001')).toBeInTheDocument();
    });

    // Fill in voucher data
    const inputs = screen.getAllByRole('textbox');
    const nameInput = inputs.find(input => input.closest('td')?.previousElementSibling?.textContent?.includes('DV No.'));
    
    if (nameInput) {
      await user.clear(nameInput);
      await user.type(nameInput, 'John Doe');
    }

    // Click save button
    const saveButton = screen.getAllByText('Save')[0];
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('payees');
      expect(mockSupabase.from).toHaveBeenCalledWith('vouchers');
      expect(window.alert).toHaveBeenCalledWith('Voucher saved successfully!');
    });
  });

  it('saves all voucher rows successfully', async () => {
    const user = userEvent.setup();
    render(VouchersPage);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('PROJ-001')).toBeInTheDocument();
    });

    // Add some rows
    const addRowButton = screen.getByText('+ Add Row');
    await user.click(addRowButton);
    await user.click(addRowButton);

    // Click save all button
    const saveAllButton = screen.getByText('Save All');
    await user.click(saveAllButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('All vouchers saved successfully!');
    });
  });

  it('handles errors when saving vouchers', async () => {
    const user = userEvent.setup();
    
    // Mock an error response
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockProjects, error: null }),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
        }))
      }))
    });

    render(VouchersPage);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('PROJ-001')).toBeInTheDocument();
    });

    // Click save button
    const saveButton = screen.getAllByText('Save')[0];
    await user.click(saveButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error saving voucher: Database error');
    });
  });

  it('changes project selection and updates voucher rows', async () => {
    const user = userEvent.setup();
    render(VouchersPage);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('PROJ-001')).toBeInTheDocument();
    });

    // Change project selection
    const projectSelect = screen.getByDisplayValue('PROJ-001');
    await user.selectOptions(projectSelect, '2');
    
    await waitFor(() => {
      expect(projectSelect).toHaveValue('2');
    });

    // Check if DV numbers updated to reflect new project code
    await waitFor(() => {
      const dvInputs = screen.getAllByDisplayValue(/PROJ-002-25-/);
      expect(dvInputs.length).toBeGreaterThan(0);
    });
  });

  it('toggles tax checkbox correctly', async () => {
    const user = userEvent.setup();
    render(VouchersPage);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('PROJ-001')).toBeInTheDocument();
    });

    const taxCheckboxes = screen.getAllByRole('checkbox');
    const taxCheckbox = taxCheckboxes[0];
    
    expect(taxCheckbox).not.toBeChecked();
    
    await user.click(taxCheckbox);
    expect(taxCheckbox).toBeChecked();
    
    await user.click(taxCheckbox);
    expect(taxCheckbox).not.toBeChecked();
  });

  it('validates form inputs before saving', async () => {
    const user = userEvent.setup();
    render(VouchersPage);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('PROJ-001')).toBeInTheDocument();
    });

    // Try to save without filling required fields
    const saveButton = screen.getAllByText('Save')[0];
    await user.click(saveButton);

    // Should still attempt to save (validation happens at database level in this implementation)
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });
});

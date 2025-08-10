import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import DashboardPage from '../routes/dashboard/+page.svelte';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }))
};

vi.mock('$lib/supabaseClient', () => ({
  supabase: mockSupabase
}));

describe('Dashboard Functionality Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProjects = [
    { id: 1, code: 'PROJ001', title: 'Test Project 1' },
    { id: 2, code: 'PROJ002', title: 'Test Project 2' }
  ];

  const mockVouchers = [
    {
      id: 1,
      dv_no: 'DV-001',
      date: '2024-01-15',
      gross: 1000.00,
      payees: { name: 'John Doe' },
      projects: { title: 'Test Project 1', code: 'PROJ001' }
    },
    {
      id: 2,
      dv_no: 'DV-002',
      date: '2024-01-14',
      gross: 1500.00,
      payees: { name: 'Jane Smith' },
      projects: { title: 'Test Project 2', code: 'PROJ002' }
    }
  ];

  describe('Dashboard Layout and Components', () => {
    it('should render dashboard title and subtitle', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => Promise.resolve({ data: mockProjects, error: null }))
          };
        }
        if (table === 'vouchers') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockVouchers, error: null }))
            }))
          };
        }
      });

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const title = container.querySelector('h1');
        expect(title).toBeInTheDocument();
        expect(title?.textContent).toBe('Dashboard');
      });
    });

    it('should show loading state initially', () => {
      const { container } = render(DashboardPage);
      
      const loading = container.querySelector('.loading');
      expect(loading).toBeInTheDocument();
      
      const spinner = container.querySelector('.spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should render statistics cards after loading', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => Promise.resolve({ data: mockProjects, error: null }))
          };
        }
        if (table === 'vouchers') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockVouchers, error: null }))
            }))
          };
        }
      });

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const statsGrid = container.querySelector('.stats-grid');
        expect(statsGrid).toBeInTheDocument();
        
        const statCards = container.querySelectorAll('.stat-card');
        expect(statCards).toHaveLength(3);
      });
    });

    it('should render navigation cards', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => Promise.resolve({ data: mockProjects, error: null }))
          };
        }
        if (table === 'vouchers') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockVouchers, error: null }))
            }))
          };
        }
      });

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const navigationGrid = container.querySelector('.navigation-grid');
        expect(navigationGrid).toBeInTheDocument();
        
        const navCards = container.querySelectorAll('.nav-card');
        expect(navCards).toHaveLength(3);
      });
    });

    it('should render quick action buttons', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => Promise.resolve({ data: mockProjects, error: null }))
          };
        }
        if (table === 'vouchers') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockVouchers, error: null }))
            }))
          };
        }
      });

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const actionsGrid = container.querySelector('.actions-grid');
        expect(actionsGrid).toBeInTheDocument();
        
        const actionButtons = container.querySelectorAll('.action-button');
        expect(actionButtons).toHaveLength(3);
      });
    });
  });

  describe('Data Loading and Statistics', () => {
    it('should calculate correct project count', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => Promise.resolve({ data: mockProjects, error: null }))
          };
        }
        if (table === 'vouchers') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockVouchers, error: null }))
            }))
          };
        }
      });

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const statNumbers = container.querySelectorAll('.stat-number');
        expect(statNumbers[0]?.textContent).toBe('2'); // 2 projects
      });
    });

    it('should calculate correct voucher count', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => Promise.resolve({ data: mockProjects, error: null }))
          };
        }
        if (table === 'vouchers') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockVouchers, error: null }))
            }))
          };
        }
      });

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const statNumbers = container.querySelectorAll('.stat-number');
        expect(statNumbers[1]?.textContent).toBe('2'); // 2 vouchers
      });
    });

    it('should calculate correct total amount', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => Promise.resolve({ data: mockProjects, error: null }))
          };
        }
        if (table === 'vouchers') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockVouchers, error: null }))
            }))
          };
        }
      });

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const statNumbers = container.querySelectorAll('.stat-number');
        expect(statNumbers[2]?.textContent).toContain('2,500.00'); // 1000 + 1500
      });
    });

    it('should handle empty data gracefully', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }));

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const statNumbers = container.querySelectorAll('.stat-number');
        expect(statNumbers[0]?.textContent).toBe('0'); // 0 projects
        expect(statNumbers[1]?.textContent).toBe('0'); // 0 vouchers
        expect(statNumbers[2]?.textContent).toContain('0.00'); // 0 amount
      });
    });
  });

  describe('Recent Activity Section', () => {
    it('should display recent voucher activity', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => Promise.resolve({ data: mockProjects, error: null }))
          };
        }
        if (table === 'vouchers') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockVouchers, error: null }))
            }))
          };
        }
      });

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const activityList = container.querySelector('.activity-list');
        expect(activityList).toBeInTheDocument();
        
        const activityItems = container.querySelectorAll('.activity-item');
        expect(activityItems.length).toBeGreaterThan(0);
      });
    });

    it('should show no activity message when no vouchers exist', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }));

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const noActivity = container.querySelector('.no-activity');
        expect(noActivity).toBeInTheDocument();
        expect(noActivity?.textContent).toContain('No recent activity found');
      });
    });

    it('should limit recent activity to 5 items', async () => {
      const manyVouchers = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        dv_no: `DV-${String(i + 1).padStart(3, '0')}`,
        date: '2024-01-15',
        gross: 1000.00,
        payees: { name: `Person ${i + 1}` },
        projects: { title: 'Test Project', code: 'PROJ001' }
      }));

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => Promise.resolve({ data: mockProjects, error: null }))
          };
        }
        if (table === 'vouchers') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: manyVouchers, error: null }))
            }))
          };
        }
      });

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const activityItems = container.querySelectorAll('.activity-item');
        expect(activityItems).toHaveLength(5);
      });
    });
  });

  describe('Navigation Links', () => {
    it('should have correct navigation links', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => Promise.resolve({ data: mockProjects, error: null }))
          };
        }
        if (table === 'vouchers') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockVouchers, error: null }))
            }))
          };
        }
      });

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const voucherLink = container.querySelector('a[href="/vouchers"]');
        const projectsLink = container.querySelector('a[href="/projects"]');
        const reportsLink = container.querySelector('a[href="/reports"]');
        
        expect(voucherLink).toBeInTheDocument();
        expect(projectsLink).toBeInTheDocument();
        expect(reportsLink).toBeInTheDocument();
      });
    });

    it('should have proper navigation card content', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => Promise.resolve({ data: mockProjects, error: null }))
          };
        }
        if (table === 'vouchers') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockVouchers, error: null }))
            }))
          };
        }
      });

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const navCards = container.querySelectorAll('.nav-card');
        expect(navCards[0]?.textContent).toContain('Vouchers');
        expect(navCards[1]?.textContent).toContain('Projects');
        expect(navCards[2]?.textContent).toContain('Reports');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when data loading fails', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } }))
      }));

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const errorMessage = container.querySelector('.error-message');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage?.textContent).toContain('Failed to load dashboard data');
      });
    });

    it('should have retry button when error occurs', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } }))
      }));

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const retryButton = container.querySelector('.retry-button');
        expect(retryButton).toBeInTheDocument();
        expect(retryButton?.textContent).toContain('Retry');
      });
    });

    it('should handle network errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => Promise.reject(new Error('Network error')))
      }));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { container } = render(DashboardPage);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading dashboard data:', expect.any(Error));
        
        const errorMessage = container.querySelector('.error-message');
        expect(errorMessage).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Data Formatting', () => {
    it('should format currency amounts correctly', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => Promise.resolve({ data: mockProjects, error: null }))
          };
        }
        if (table === 'vouchers') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockVouchers, error: null }))
            }))
          };
        }
      });

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const activityAmounts = container.querySelectorAll('.activity-amount');
        expect(activityAmounts[0]?.textContent).toContain('₱');
        expect(activityAmounts[0]?.textContent).toContain('1,000.00');
      });
    });

    it('should format dates correctly', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => Promise.resolve({ data: mockProjects, error: null }))
          };
        }
        if (table === 'vouchers') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockVouchers, error: null }))
            }))
          };
        }
      });

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const activityDates = container.querySelectorAll('.activity-date');
        expect(activityDates[0]?.textContent).toMatch(/\w+ \d{1,2}, \d{4}/);
      });
    });
  });

  describe('Quick Actions', () => {
    it('should have correct quick action buttons', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => Promise.resolve({ data: mockProjects, error: null }))
          };
        }
        if (table === 'vouchers') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockVouchers, error: null }))
            }))
          };
        }
      });

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const actionButtons = container.querySelectorAll('.action-button');
        expect(actionButtons[0]?.textContent).toContain('Add New Voucher');
        expect(actionButtons[1]?.textContent).toContain('Add New Project');
        expect(actionButtons[2]?.textContent).toContain('Generate Reports');
      });
    });

    it('should have proper button styling classes', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => Promise.resolve({ data: mockProjects, error: null }))
          };
        }
        if (table === 'vouchers') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockVouchers, error: null }))
            }))
          };
        }
      });

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const primaryButton = container.querySelector('.action-button.primary');
        const secondaryButton = container.querySelector('.action-button.secondary');
        const tertiaryButton = container.querySelector('.action-button.tertiary');
        
        expect(primaryButton).toBeInTheDocument();
        expect(secondaryButton).toBeInTheDocument();
        expect(tertiaryButton).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid classes', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => Promise.resolve({ data: mockProjects, error: null }))
          };
        }
        if (table === 'vouchers') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockVouchers, error: null }))
            }))
          };
        }
      });

      const { container } = render(DashboardPage);

      await waitFor(() => {
        const statsGrid = container.querySelector('.stats-grid');
        const navigationGrid = container.querySelector('.navigation-grid');
        const actionsGrid = container.querySelector('.actions-grid');
        
        expect(statsGrid).toBeInTheDocument();
        expect(navigationGrid).toBeInTheDocument();
        expect(actionsGrid).toBeInTheDocument();
      });
    });
  });
});

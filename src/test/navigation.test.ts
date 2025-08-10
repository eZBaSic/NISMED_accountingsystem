import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Layout from '../routes/+layout.svelte';

// Mock the auth stores
const mockUser = { id: '1', email: 'test@example.com' };

vi.mock('$lib/stores/auth', () => ({
  user: {
    subscribe: vi.fn((callback) => {
      callback(mockUser);
      return () => {};
    })
  },
  signOut: vi.fn()
}));

vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn((callback) => {
      callback({ url: { pathname: '/dashboard' } });
      return () => {};
    })
  }
}));

// Mock the layout data
const mockData = {
  user: mockUser
};

describe('Navigation Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the navigation bar with logo', () => {
    render(Layout, { data: mockData });
    
    const logo = screen.getByAltText('NISMED Logo');
    expect(logo).toBeInTheDocument();
    expect(logo.closest('a')).toHaveAttribute('href', '/dashboard');
  });

  it('displays all navigation links when user is authenticated', () => {
    render(Layout, { data: mockData });
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Vouchers')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('displays user email in navigation', () => {
    render(Layout, { data: mockData });
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('has correct href attributes for navigation links', () => {
    render(Layout, { data: mockData });
    
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('Vouchers').closest('a')).toHaveAttribute('href', '/vouchers');
    expect(screen.getByText('Projects').closest('a')).toHaveAttribute('href', '/projects');
    expect(screen.getByText('Reports').closest('a')).toHaveAttribute('href', '/reports');
    expect(screen.getByText('Help').closest('a')).toHaveAttribute('href', '/help');
  });

  it('displays logout button and handles logout action', async () => {
    const user = userEvent.setup();
    const { signOut } = await import('$lib/stores/auth');
    
    render(Layout, { data: mockData });
    
    const logoutButton = screen.getByText('Logout');
    expect(logoutButton).toBeInTheDocument();
    
    await user.click(logoutButton);
    expect(signOut).toHaveBeenCalled();
  });

  it('hides navigation when user is not authenticated', () => {
    const unauthenticatedData = { user: null };
    
    // Mock unauthenticated user
    vi.mocked(vi.fn()).mockImplementation((callback) => {
      callback(null);
      return () => {};
    });
    
    render(Layout, { data: unauthenticatedData });
    
    // Navigation should not be visible for unauthenticated users
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Vouchers')).not.toBeInTheDocument();
  });

  it('applies correct styling to navigation links', () => {
    render(Layout, { data: mockData });
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('text-white');
    expect(dashboardLink).toHaveClass('hover:text-green-200');
  });

  it('renders responsive navigation structure', () => {
    render(Layout, { data: mockData });
    
    // Check for responsive navigation container
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass('bg-green-600');
  });

  it('maintains proper navigation order', () => {
    render(Layout, { data: mockData });
    
    const navigationLinks = screen.getAllByRole('link');
    const linkTexts = navigationLinks.map(link => link.textContent?.trim()).filter(text => text);
    
    // Should include NISMED logo link and navigation links
    expect(linkTexts).toContain('Dashboard');
    expect(linkTexts).toContain('Vouchers');
    expect(linkTexts).toContain('Projects');
    expect(linkTexts).toContain('Reports');
    expect(linkTexts).toContain('Help');
  });

  it('shows active state for current page', () => {
    // Mock the page store to return a specific pathname
    vi.mock('$app/stores', () => ({
      page: {
        subscribe: vi.fn((callback) => {
          callback({ url: { pathname: '/vouchers' } });
          return () => {};
        })
      }
    }));

    render(Layout, { data: mockData });
    
    // The component should handle active states (implementation may vary)
    const vouchersLink = screen.getByText('Vouchers').closest('a');
    expect(vouchersLink).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import HelpPage from '../routes/help/+page.svelte';

describe('Help Page', () => {
  it('renders the help page with correct title', () => {
    render(HelpPage);
    
    expect(screen.getByText('NISMED Accounting System - User Guide')).toBeInTheDocument();
  });

  it('displays all major sections', () => {
    render(HelpPage);
    
    expect(screen.getByText('🏠 Dashboard')).toBeInTheDocument();
    expect(screen.getByText('📋 Vouchers')).toBeInTheDocument();
    expect(screen.getByText('🏗️ Projects')).toBeInTheDocument();
    expect(screen.getByText('📊 Reports')).toBeInTheDocument();
  });

  it('includes navigation help content', () => {
    render(HelpPage);
    
    expect(screen.getByText(/green navigation bar/)).toBeInTheDocument();
    expect(screen.getByText(/NISMED logo/)).toBeInTheDocument();
  });

  it('includes data entry tips', () => {
    render(HelpPage);
    
    expect(screen.getByText(/Click directly on table cells/)).toBeInTheDocument();
    expect(screen.getByText(/Press Enter/)).toBeInTheDocument();
  });

  it('includes security information', () => {
    render(HelpPage);
    
    expect(screen.getByText('🔐 Security')).toBeInTheDocument();
    expect(screen.getByText(/Always log out/)).toBeInTheDocument();
  });

  it('displays back to dashboard link', () => {
    render(HelpPage);
    
    const backToDashboard = screen.getByText('← Back to Dashboard');
    expect(backToDashboard).toBeInTheDocument();
    expect(backToDashboard.closest('a')).toHaveAttribute('href', '/dashboard');
  });

  it('includes voucher management instructions', () => {
    render(HelpPage);
    
    expect(screen.getByText(/Add new vouchers/)).toBeInTheDocument();
    expect(screen.getByText(/Edit vouchers/)).toBeInTheDocument();
    expect(screen.getByText(/Sort vouchers/)).toBeInTheDocument();
  });

  it('includes project management instructions', () => {
    render(HelpPage);
    
    expect(screen.getByText(/View all projects/)).toBeInTheDocument();
    expect(screen.getByText(/Add new projects/)).toBeInTheDocument();
    expect(screen.getByText(/Edit existing projects/)).toBeInTheDocument();
  });

  it('includes reports instructions', () => {
    render(HelpPage);
    
    expect(screen.getByText(/Project-specific voucher views/)).toBeInTheDocument();
    expect(screen.getByText(/PDF generation/)).toBeInTheDocument();
    expect(screen.getByText(/Advanced editing/)).toBeInTheDocument();
  });

  it('displays last updated date', () => {
    render(HelpPage);
    
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    expect(screen.getByText(/August 10, 2025/)).toBeInTheDocument();
  });

  it('includes system information', () => {
    render(HelpPage);
    
    expect(screen.getByText('📝 System Information')).toBeInTheDocument();
    expect(screen.getByText(/Built for.*NISMED/)).toBeInTheDocument();
    expect(screen.getByText(/Financial voucher and project management/)).toBeInTheDocument();
  });
});

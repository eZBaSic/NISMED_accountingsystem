import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import Login from '../routes/login/+page.svelte';

// Mock the auth store
vi.mock('$lib/stores/auth', () => ({
  signIn: vi.fn(),
  user: {
    subscribe: vi.fn(() => () => {})
  }
}));

// Mock SvelteKit modules
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(Login);
    
    expect(screen.getByText('NISMED Accounting System')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows validation for empty form', () => {
    render(Login);
    
    const signInButton = screen.getByRole('button', { name: 'Sign in' });
    expect(signInButton).toBeDisabled();
  });

  it('enables sign in button when form is filled', async () => {
    render(Login);
    
    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const signInButton = screen.getByRole('button', { name: 'Sign in' });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });

    expect(signInButton).not.toBeDisabled();
  });

  it('displays error message on authentication failure', async () => {
    const { signIn } = await import('$lib/stores/auth');
    vi.mocked(signIn).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' }
    });

    render(Login);
    
    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const signInButton = screen.getByRole('button', { name: 'Sign in' });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'wrongpassword' } });
    await fireEvent.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText('Authentication Error')).toBeInTheDocument();
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
    });
  });

  it('shows loading state during authentication', async () => {
    const { signIn } = await import('$lib/stores/auth');
    vi.mocked(signIn).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { user: null }, error: null }), 100)));

    render(Login);
    
    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const signInButton = screen.getByRole('button', { name: 'Sign in' });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.click(signInButton);

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(signInButton).toBeDisabled();
  });
});

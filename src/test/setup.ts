import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Extend global for custom properties
declare global {
  var mockSupabase: any;
}

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
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
  }))
};

// Mock SvelteKit modules
vi.mock('$lib/supabaseClient', () => ({
  supabase: mockSupabase
}));

vi.mock('$app/environment', () => ({
  browser: true
}));

vi.mock('$env/static/public', () => ({
  PUBLIC_SUPABASE_URL: 'mock-url',
  PUBLIC_SUPABASE_KEY: 'mock-key'
}));

vi.mock('$app/state', () => ({
  page: {
    url: {
      pathname: '/vouchers'
    }
  }
}));

vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

global.mockSupabase = mockSupabase;

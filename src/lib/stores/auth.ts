import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabaseClient';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { goto } from '$app/navigation';

// Create writable stores for user and session
export const user = writable<User | null>(null);
export const session = writable<Session | null>(null);
export const loading = writable<boolean>(true);

// Initialize auth state
export function initializeAuth() {
  if (!browser) return;

  // Get initial session
  supabase.auth.getSession().then(({ data: { session: initialSession } }: { data: { session: Session | null } }) => {
    session.set(initialSession);
    user.set(initialSession?.user ?? null);
    loading.set(false);
  });

  // Listen for auth changes
  supabase.auth.onAuthStateChange((event: AuthChangeEvent, newSession: Session | null) => {
    session.set(newSession);
    user.set(newSession?.user ?? null);
    loading.set(false);
    
    // Handle successful sign in - only redirect if we're on login page
    if (event === 'SIGNED_IN' && newSession && window.location.pathname === '/login') {
      // Use window.location to force a full page reload and trigger server-side auth
      window.location.href = '/dashboard';
    }
    
    // Handle sign out
    if (event === 'SIGNED_OUT') {
      goto('/login');
    }
  });
}

// Sign in function
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

// Sign out function
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Check if user is authenticated
export function isAuthenticated(userStore: User | null): boolean {
  return userStore !== null;
}

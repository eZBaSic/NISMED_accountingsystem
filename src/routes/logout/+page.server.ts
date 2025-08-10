import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export async function load() {
  // Sign out the user
  await supabase.auth.signOut();
  
  // Redirect to login page
  throw redirect(302, '/login');
}

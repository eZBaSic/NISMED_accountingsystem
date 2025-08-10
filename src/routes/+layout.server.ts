import { redirect } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY } from '$env/static/public';

export async function load({ url, cookies }) {
  // Create a server-side Supabase client that can read/write cookies
  const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY, {
    cookies: {
      get: (key) => cookies.get(key),
      set: (key, value, options) => {
        cookies.set(key, value, { ...options, path: '/' });
      },
      remove: (key, options) => {
        cookies.delete(key, { ...options, path: '/' });
      },
    },
  });

  // Get authenticated user (more secure than getSession)
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
  
  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route));
  
  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    throw redirect(302, '/login');
  }
  
  // If user is authenticated and trying to access login page
  if (user && url.pathname === '/login') {
    throw redirect(302, '/dashboard');
  }
  
  // If user is authenticated but accessing root, redirect to dashboard
  if (user && url.pathname === '/') {
    throw redirect(302, '/dashboard');
  }
  
  return {
    session: user ? { user } : null,
    user: user ?? null
  };
}

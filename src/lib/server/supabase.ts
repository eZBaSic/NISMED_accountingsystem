import { createServerClient } from '@supabase/ssr';
import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_KEY
} from '$env/static/public';

export function createSupabaseServer(event: any) {
	return createServerClient(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),

				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, {
							...options,
							path: '/'
						});
					});
				}
			}
		}
	);
}
import type { Handle } from '@sveltejs/kit';
import { createSupabaseServer } from '$lib/server/supabase';

export const handle: Handle = async ({
	event,
	resolve
}) => {
	event.locals.supabase =
		createSupabaseServer(event);

	const {
		data: { session }
	} = await event.locals.supabase.auth.getSession();

	event.locals.session = session;
	event.locals.user = session?.user ?? null;

	return resolve(event);
};
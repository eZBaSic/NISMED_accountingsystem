import { redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export const load = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const { data: profile, error } = await supabaseAdmin
		.from('profiles')
		.select('role')
		.eq('id', locals.user.id)
		.single();

	if (error || profile?.role !== 'admin') {
		throw redirect(303, '/');
	}

	return {
		user: locals.user,
		role: profile.role
	};
};
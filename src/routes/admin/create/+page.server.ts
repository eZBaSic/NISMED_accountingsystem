import { fail, redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const email = formData.get('email')?.toString();
		const password = formData.get('password')?.toString();
		const role = formData.get('role')?.toString() ?? 'user';

		if (!email || !password) {
			return fail(400, {
				message: 'Missing fields'
			});
		}

		const { data, error } =
			await supabaseAdmin.auth.admin.createUser({
				email,
				password,
				email_confirm: true
			});

		if (error) {
			return fail(400, {
				message: error.message
			});
		}

		const { error: updateError } =
			await supabaseAdmin
				.from('profiles')
				.update({ role })
				.eq('id', data.user.id);

		if (updateError) {
			return fail(400, {
				message: updateError.message
			});
		}

		throw redirect(303, '/admin');
	}
};
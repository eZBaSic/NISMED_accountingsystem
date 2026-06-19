import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { fail } from '@sveltejs/kit';

export async function load() {
	const [{ data: users }, { data: projects }, {data: userProjects}] =
		await Promise.all([
			supabaseAdmin
				.from('profiles')
				.select('*')
				.order('email'),

			supabaseAdmin
				.from('projects')
				.select('*')
				.order('code'),
			supabaseAdmin
				.from('user_projects')
				.select('user_id, project_id')
		]);
	

	return {
		users,
		projects,
		userProjects
	};
}

export const actions = {
	updateUser: async ({ request }) => {
		const formData = await request.formData();

		const userId = formData.get('userId');
		const email = formData.get('email');
		const role = formData.get('role');

		const projectIds =
			formData.getAll('projectIds');

		await supabaseAdmin
			.from('profiles')
			.update({
				email,
				role
			})
			.eq('id', userId);

		await supabaseAdmin
			.from('user_projects')
			.delete()
			.eq('user_id', userId);

		if (projectIds.length) {
			await supabaseAdmin
				.from('user_projects')
				.insert(
					projectIds.map(id => ({
						user_id: userId,
						project_id: id
					}))
				);
		}
	},
	deleteUser: async ({ request }) => {
		const formData = await request.formData();

		const userId = formData.get('userId')?.toString();
		
		if (!userId) {
			return fail(400, {
				message: 'Missing user id'
			});
		}
		
		const { error } =
			await supabaseAdmin.auth.admin.deleteUser(userId);
		
		if (error) {
			return fail(400, {
				message: error.message
			});
		}

		return {
			success: true
		};
	},

	resetPassword: async ({ request }) => {
		const formData = await request.formData();

		const userId = formData.get('userId');

		const { data: profile } =
			await supabaseAdmin
				.from('profiles')
				.select('email')
				.eq('id', userId)
				.single();

		await supabaseAdmin.auth.resetPasswordForEmail(
			profile.email
		);
	}
};
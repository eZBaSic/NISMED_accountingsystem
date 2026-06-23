import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		return {
			summaries: [],
			role: 'user'
		};
	}

	const { data: profile } = await supabaseAdmin
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single();

	let summaries = [];

	if (profile?.role === 'admin') {
		const { data } = await supabaseAdmin
			.from('summaries')
			.select('*');

		summaries = data ?? [];
	} else {
		const { data: userProjects } = await supabaseAdmin
			.from('user_projects')
			.select('project_id')
			.eq('user_id', user.id);

		const projectIds =
			userProjects?.map((p) => p.project_id) ?? [];

		if (projectIds.length > 0) {
			const { data } = await supabaseAdmin
				.from('summaries')
				.select('*')
				.in('project_id', projectIds);

			summaries = data ?? [];
		}
	}

	return {
		summaries,
		role: profile?.role ?? 'user'
	};
};

export const actions: Actions = {
	createProject: async ({ request, locals }) => {
		const form = await request.formData();

		const code = form.get('code');
		const title = form.get('title');
		const tax = Number(form.get('tax'));
		const authorized_rep =
			form.get('authorized_rep');
		const approver = form.get('approver');
		const admin_officer =
			form.get('admin_officer');

		const user = locals.user;

		if (!user) {
			return fail(401);
		}

		const { data: project, error } =
			await supabaseAdmin
				.from('projects')
				.insert({
					code,
					title,
					tax,
					authorized_rep,
					approver,
					admin_officer
				})
				.select()
				.single();

		if (error) {
			return fail(400, {
				message: error.message
			});
		}

		await supabaseAdmin
			.from('user_projects')
			.insert({
				user_id: user.id,
				project_id: project.id
			});

		return {
			success: true
		};
	},

	updateProject: async ({ request }) => {
		const form = await request.formData();

		const id = Number(form.get('id'));

		const { error } =
			await supabaseAdmin
				.from('projects')
				.update({
					code: form.get('code'),
					title: form.get('title'),
					tax: Number(form.get('tax')),
					authorized_rep:
						form.get('authorized_rep'),
					approver: form.get('approver'),
					admin_officer:
						form.get('admin_officer')
				})
				.eq('id', id);

		if (error) {
			return fail(400, {
				message: error.message
			});
		}

		return {
			success: true
		};
	},

	deleteProject: async ({ request }) => {
		const form = await request.formData();

		const id = Number(form.get('id'));

		await supabaseAdmin
			.from('user_projects')
			.delete()
			.eq('project_id', id);

		const { error } =
			await supabaseAdmin
				.from('projects')
				.delete()
				.eq('id', id);

		if (error) {
			return fail(400, {
				message: error.message
			});
		}

		return {
			success: true
		};
	}
};
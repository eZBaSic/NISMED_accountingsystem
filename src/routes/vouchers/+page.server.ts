// src/routes/vouchers/+page.server.ts

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({locals}) => {
	const user = locals.user;

	if (!user) {
		throw redirect(303, '/login');
	}

	const { data: profile } =
		await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

	let projects;

	if (profile?.role === 'admin') {
		const result = await locals.supabase
			.from('projects')
			.select('id, code, title')
			.order('code');

		projects = result.data ?? [];
	} else {
		const { data: userProjects } =
			await locals.supabase
				.from('user_projects')
				.select('project_id')
				.eq('user_id', user.id);

		const projectIds =
			userProjects?.map(
				(p) => p.project_id
			) ?? [];

		if (projectIds.length) {
			const result =
				await locals.supabase
					.from('projects')
					.select(
						'id, code, title'
					)
					.in('id', projectIds)
					.order('code');

			projects = result.data ?? [];
		} else {
			projects = [];
		}
	}

	return {
		role: profile?.role ?? 'user',
		projects
	};
};
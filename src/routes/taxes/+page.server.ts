import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) {
		return {
			projects: [],
			years: [],
			vouchers: []
		};
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single();

	const isAdmin = profile?.role === 'admin';

	let projects: { id: number; code: string }[] = [];

	if (isAdmin) {
		const { data } = await supabase
			.from('projects')
			.select('id, code')
			.order('code');

		projects = data ?? [];
	} else {
		const { data: assignments } = await supabase
			.from('user_projects')
			.select('project_id')
			.eq('user_id', user.id);

		const ids = assignments?.map((x) => x.project_id) ?? [];

		if (ids.length > 0) {
			const { data } = await supabase
				.from('projects')
				.select('id, code')
				.in('id', ids)
				.order('code');

			projects = data ?? [];
		}
	}

	const allowedProjectIds = projects.map((p) => p.id);

	if (allowedProjectIds.length === 0) {
		return {
			projects,
			years: [],
			vouchers: []
		};
	}

	const { data: vouchers } = await supabase
		.from('vouchers')
		.select(`
			id,
			dv_no,
			date,
			gross,
			particulars,
			remarks,
			project_id,
			projects (
				code
			),
			payees (
				name,
				tin_id
			)
		`)
		.in('project_id', allowedProjectIds)
		.eq('has_tax_deduction', false)
		.order('date', { ascending: false });

	const years = [
		...new Set(
			(vouchers ?? [])
				.map((v) => new Date(v.date).getFullYear())
				.filter(Boolean)
		)
	].sort((a, b) => b - a);

	return {
		projects,
		years,
		vouchers: vouchers ?? []
	};
};
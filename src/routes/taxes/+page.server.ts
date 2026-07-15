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
		.select('first_name, last_name, role')
		.eq('id', user.id)
		.single();

	const isAdmin = profile?.role === 'admin';
	const firstName = profile?.first_name?.toLowerCase() ?? '';
	const lastName = profile?.last_name?.toLowerCase() ?? '';

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

		const ids = assignments?.map((x: any) => x.project_id) ?? [];

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

	let vouchers = [];
	let { data: vouchersData, error: vouchersError } = await supabase
		.from('vouchers')
		.select(`
			id,
			dv_no,
			date,
			gross,
			has_tax_deduction,
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
		.order('date', { ascending: false });

	if (vouchersError) {
		throw vouchersError;
	}

	if (isAdmin) {
		vouchers = vouchersData;

	} else {
		if (firstName != '' || lastName != '') {
			vouchers =
				vouchersData?.
				filter((v: any) => {
					const name = v.payees?.name?.toLowerCase() ?? '';

					return (
						name.includes(firstName) && name.includes(lastName)
					);
				})
		}
	}
	
	const years = [
		...new Set(
			(vouchers ?? [])
				.map((v: any) => new Date(v.date).getFullYear())
				.filter(Boolean)
		)
	].sort((a: any, b: any) => b - a) as number[];

	return {
		projects,
		years: years ?? [],
		vouchers: vouchers ?? []
	};
};

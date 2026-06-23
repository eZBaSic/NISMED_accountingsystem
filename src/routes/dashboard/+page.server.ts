import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', locals.user.id)
		.single();

	let projectIds: number[] = [];

	if (profile?.role !== 'admin') {
		const { data: userProjects } = await locals.supabase
			.from('user_projects')
			.select('project_id')
			.eq('user_id', locals.user.id);

		projectIds =
			userProjects?.map((p) => p.project_id) ?? [];
	}

	let projectsQuery = locals.supabase
		.from('projects')
		.select('*');

	if (profile?.role !== 'admin' && projectIds.length > 0) {
		projectsQuery = projectsQuery.in('id', projectIds);
	}

	const { data: projects } = await projectsQuery;

	let vouchersQuery = locals.supabase
		.from('vouchers')
		.select(`
			*,
			payees(name),
			projects(title, code)
		`)
		.order('date', { ascending: false });

	if (
		profile?.role !== 'admin' &&
		projectIds.length > 0
	) {
		vouchersQuery =
			vouchersQuery.in(
				'project_id',
				projectIds
			);
	}

	const { data: vouchers } =
		await vouchersQuery;

	const totalProjects =
		projects?.length ?? 0;

	const totalVouchers =
		vouchers?.length ?? 0;

	const totalAmount =
		vouchers?.reduce(
			(sum, voucher) =>
				sum + (voucher.gross ?? 0),
			0
		) ?? 0;

	const recentActivity =
		(vouchers?.slice(0, 5) ?? []).map(
			(voucher) => ({
				type: 'voucher',
				title: `${voucher.dv_no} - ${voucher.payees?.name}`,
				date: voucher.date,
				amount: voucher.gross
			})
		);

	return {
		totalProjects,
		totalVouchers,
		totalAmount,
		recentActivity,
		role: profile?.role ?? 'user'
	};
};
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { supabase }, url }) => {
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) {
		return {
			projects: [],
			vouchers: [],
			selectedProjectId: null
		};
	}

    const projectParam =
		url.searchParams.get('project');

	// role
	const { data: profile } = await supabase
		.from('profiles')
		.select('first_name, last_name, role')
		.eq('id', user.id)
		.single();

	const firstName = profile?.first_name?.toLowerCase() ?? '';
	const lastName = profile?.last_name?.toLowerCase() ?? '';

	let projects = [];

	if (profile?.role === 'admin') {
		const { data } = await supabase
			.from('projects')
			.select(
				'id, code, title, authorized_rep, approver'
			)
			.order('code');

		projects = data ?? [];
	} else {
		const { data: userProjects } = await supabase
			.from('user_projects')
			.select('project_id')
			.eq('user_id', user.id);

		const projectIds =
			userProjects?.map((p: any) => p.project_id) ?? [];

		if (projectIds.length) {
			const { data } = await supabase
				.from('projects')
				.select(
					'id, code, title, authorized_rep, approver'
				)
				.in('id', projectIds)
				.order('code');

			projects = data ?? [];
		}
	}

	const selectedProjectId = projectParam ? Number(projectParam) : projects.length > 0 ? projects[0].id : null;

	let vouchers = [];

	if (selectedProjectId) {
		const { data } = await supabase
			.from('vouchers')
			.select(`
				id,
				dv_no,
				date,
				nth_yearly_voucher,
				gross,
				has_tax_deduction,
				particulars,
				payment_mode,
				remarks,
				payees (
					name,
					address
				)
			`)
			.eq('project_id', selectedProjectId)
			.order('dv_no');

		if (profile?.role === 'admin') {			
			vouchers =
				data?.map((v: any) => ({
					id: v.id,
					dv_no: v.dv_no,
					payee_name: v.payees?.name ?? '',
					payee_address: v.payees?.address ?? '',
					date: v.date,
					nth_yearly_voucher:
						v.nth_yearly_voucher,
					gross: v.gross,
					has_tax_deduction:
						v.has_tax_deduction,
					particulars: v.particulars,
					payment_mode: v.payment_mode,
					remarks: v.remarks ?? ''
				})) ?? [];

		} else {
			if (firstName != '' || lastName != '') {
				vouchers =
				data?.
				filter((v: any) => {
					const name = v.payees?.name?.toLowerCase() ?? '';

					return (
						name.includes(firstName) && name.includes(lastName)
					);
				})
				.map((v: any) => ({
					id: v.id,
					dv_no: v.dv_no,
					payee_name: v.payees?.name ?? '',
					payee_address: v.payees?.address ?? '',
					date: v.date,
					nth_yearly_voucher:
						v.nth_yearly_voucher,
					gross: v.gross,
					has_tax_deduction:
						v.has_tax_deduction,
					particulars: v.particulars,
					payment_mode: v.payment_mode,
					remarks: v.remarks ?? ''
				})) ?? [];
			}
		}
		
	}

	return {
		projects,
		vouchers,
		selectedProjectId
	};
};

export const actions: Actions = {
	updateVoucher: async ({
		request,
		locals: { supabase }
	}) => {
		const form = await request.formData();

		const id = Number(form.get('id'));

		const { error } = await supabase
			.from('vouchers')
			.update({
				dv_no: form.get('dv_no'),
				date: form.get('date'),
				gross: Number(form.get('gross')),
				has_tax_deduction:
					form.get('has_tax_deduction') ===
					'on',
				particulars:
					form.get('particulars'),
				payment_mode:
					form.get('payment_mode'),
				remarks: form.get('remarks')
			})
			.eq('id', id);

		if (error) {
			return fail(400, {
				message: error.message
			});
		}

		return { success: true };
	},

	deleteVoucher: async ({
		request,
		locals: { supabase }
	}) => {
		const form = await request.formData();

		const id = Number(form.get('id'));

		const { error } = await supabase
			.from('vouchers')
			.delete()
			.eq('id', id);

		if (error) {
			return fail(400, {
				message: error.message
			});
		}

		return { success: true };
	}
};
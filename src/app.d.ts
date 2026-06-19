// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				email: string;
				role: string;
			} | null;
		}
	}
	
	// tables
	interface cash_advance {
		id?: number,
		project_code: string,
		date_requested: string,
		date_received?: string,
		received_from?: string,
		cash_amount: number,
	}

	interface liquidation_group {
		id?: number,
		project_code: string,
		misc_particular: string,
		has_tax_deduction: boolean,
		gross: number
	}

	interface payee {
		name: string,
		id?: number,
		address?: string,
		tin_id?: string,
	}
	
	interface project {
		code: string,
		id?: number,
		title: string,
		tax: number,	
		authorized_rep: string,
		approver: string,
		admin_officer: string,
	}

	interface voucher {
		dv_no: string,
		id?: number,
		payee_id: string,
		project_id: string,
		date: string,
		nth_yearly_voucher: number,
		gross: number,
		has_tax_deduction: boolean,
		particulars: string,
		payment_mode: string,
		remarks?: string,
	}

	interface voucher_entry {
		project_id: string,
		dv_no: string,
		name: string,
		address: string,
		date: string,
		gross: number,
		tax: boolean,
		particulars: string,
		payment_mode: string,
		remarks: string,
	}

	// summaries
	interface summary {
		code: string,
		title: string,
		total_vouchers: number,
		gross_total: number,
		net_total: number,
		project_id?: number
		authorized_rep: string,
		approver: string,
		admin_officer: string,
		tax: number,
	}

	// sorting types
	type SortField = 'dv_no' | 'name' | 'date' | null;
	type SortDirection = 'asc' | 'desc';

	// authentication types
	interface User {
		id: string;
		email: string;
		user_metadata?: {
			full_name?: string;
		};
	}

	interface AuthSession {
		user: User;
		access_token: string;
		refresh_token: string;
		expires_at: number;
	}
}

export {};

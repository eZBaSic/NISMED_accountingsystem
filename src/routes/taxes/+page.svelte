<script lang="ts">
	import { generateYearlyTaxPDF, generateProjectTaxPDF, type YearlyTaxPDFData, type ProjectTaxPDFData } from '$lib/pdfGenerator_tax';
    import {exportExcel, type IndividualReport} from '$lib/excelGenerator';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Project selection - expanded to include all fields needed for PDF
	let years: number[] = $derived(data.years);
	const months = [
		{ value: 1, label: 'January' },
		{ value: 2, label: 'February' },
		{ value: 3, label: 'March' },
		{ value: 4, label: 'April' },
		{ value: 5, label: 'May' },
		{ value: 6, label: 'June' },
		{ value: 7, label: 'July' },
		{ value: 8, label: 'August' },
		{ value: 9, label: 'September' },
		{ value: 10, label: 'October' },
		{ value: 11, label: 'November' },
		{ value: 12, label: 'December' }
	];

	let startMonth = $state(1);
	let endMonth = $state(12);

	let selectedYear = $derived<number | null>(
		years[0] ?? null
	);
	let searchName = $state('');

	let projects = $derived(data.projects);
	const allVouchers = $derived(data.vouchers);

    let selectedProjectCode: string = $state('');

	const vouchers = $derived.by(() => {
		if (!selectedYear || !selectedProjectCode)
			return [];

		return allVouchers
			.filter(
				(v) =>
					new Date(v.date).getFullYear() ===
						selectedYear &&
					v.projects?.code ===
						selectedProjectCode
			)
			.map((v: any) => ({
				id: v.id,
				dv_no: v.dv_no,
				payee_name:
					v.payees?.name ?? 'Unknown',
				payee_tin_id:
					v.payees?.tin_id ?? '',
				date: v.date,
				gross: v.gross,
				particulars: v.particulars,
				remarks: v.remarks ?? '',
				has_tax_deduction: v.has_tax_deduction,
				taxed_amount: v.has_tax_deduction ? v.gross * 0.1 : 0,
				net_amount: v.has_tax_deduction ? v.gross * 0.9 : v.gross
			}));
	});
    const yearly = $derived.by(() => {
		if (!selectedYear) return [];

		const filtered = allVouchers.filter(
			(v) =>
				new Date(v.date).getFullYear() === selectedYear
		);

		const yearlyMap: Record<string, any> = {};

		for (const v of filtered) {
			const key = String(v.project_id);

			if (!yearlyMap[key]) {
				yearlyMap[key] = {
					project_code: v.projects?.code,
					total_gross: 0,
					taxed_amount: 0
				};
			}

			yearlyMap[key].total_gross += v.gross;
			yearlyMap[key].taxed_amount += v.has_tax_deduction ? v.gross * 0.1 : 0;
		}

		return Object.values(yearlyMap).map((v: any) => ({
			project_code: v.project_code,
			gross: v.total_gross,
			taxed_amount: v.taxed_amount,
			net_amount: v.total_gross * 0.9
		}));
	});
	let loading = $state(false);

	// Voucher data with proper joins
	interface VoucherWithDetails {
		id: number;
		dv_no: string;
		payee_name: string;
		payee_tin_id: string;
		date: string;
		gross: number;
		particulars: string;
        taxed_amount: number;
        net_amount: number;
        remarks: string;
	}

    interface YearlyWithDetails {
		project_code: string;
		gross: number;
        taxed_amount: number;
        net_amount: number;
	}

	// Sorting state
	let sortField: 'dv_no' | 'payee_name' | 'date' | null = null;
	let sortDirection: 'asc' | 'desc' = 'asc';

	// Computed sorted vouchers
	const sortedVouchers = $derived(
		sortVouchers(vouchers, sortField, sortDirection)
	);

	// Sorting function
	function sortVouchers(
		rows: VoucherWithDetails[],
		field: 'dv_no' | 'payee_name' | 'date' | null,
		direction: 'asc' | 'desc'
	): VoucherWithDetails[] {
		if (!field) return rows;

		return [...rows].sort((a, b) => {
			let valueA: string | number;
			let valueB: string | number;

			switch (field) {
				case 'dv_no':
					valueA = a.dv_no.toLowerCase();
					valueB = b.dv_no.toLowerCase();
					break;
				case 'payee_name':
					valueA = a.payee_name.toLowerCase();
					valueB = b.payee_name.toLowerCase();
					break;
				case 'date':
					valueA = new Date(a.date).getTime();
					valueB = new Date(b.date).getTime();
					break;
				default:
					return 0;
			}

			if (valueA < valueB) return direction === 'asc' ? -1 : 1;
			if (valueA > valueB) return direction === 'asc' ? 1 : -1;
			return 0;
		});
	}

	// Handle sort click
	function handleSort(field: 'dv_no' | 'payee_name' | 'date') {
		if (sortField === field) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDirection = 'asc';
		}
	}

    async function generateExcel(project: VoucherWithDetails []) {
        if (!selectedProjectCode) {
			alert('Please select a project first');
			return;
		}
        try{
            const testing: IndividualReport [] = project.map((p) => ({    // FIX INTERFACE
                payee_name: p.payee_name,
                date: p.date,
                gross: p.gross,
                taxed_amount: p.taxed_amount,
                net_amount: p.net_amount
		}));

        await exportExcel(testing)
        } catch (error) {
			console.error('Error generating PDF:', error);
			alert('Error generating Excel File.');
		}
    }

	async function generateExcelProject(project: VoucherWithDetails []) {
        if (!selectedProjectCode) {
			alert('Please select a project first');
			return;
		}
        try{
            const testing: IndividualReportProject [] = project.map((p) => ({    // FIX INTERFACE
				payee_name: p.payee_name,
				payee_tin_id: p.payee_tin_id,
				date: p.date,
				dv_no: p.dv_no,
				particulars: p.particulars,
				gross: p.gross,
				taxed_amount: p.taxed_amount,
				net_amount: p.net_amount,
				remarks: p.remarks
		}));

        await exportExcelProject(testing)
        } catch (error) {
			console.error('Error generating PDF:', error);
			alert('Error generating Excel File.');
		}
    }

	// PDF Generation Functions
	async function generateProjectPDF(project: VoucherWithDetails []) {
		if (!selectedProjectCode) {
			alert('Please select a project first');
			return;
		}

		try {
			const projectPDFData: ProjectTaxPDFData [] = project.map((p) => ({    // FIX INTERFACE
				id: p.id,
				dv_no: p.dv_no,
				payee_name: p.payee_name,
				payee_tin_id: p.payee_tin_id,
				date: p.date,
				gross: p.gross,
				particulars: p.particulars,
                taxed_amount: p.taxed_amount,
                net_amount: p.net_amount,
                remarks: p.remarks
			}));
			await generateProjectTaxPDF(projectPDFData, selectedProjectCode);
		} catch (error) {
			console.error('Error generating PDF:', error);
			alert('Error generating PDF. Make sure jsPDF library is loaded.');
		}
	}

	async function generateYearlyPDF(yearly: YearlyWithDetails[]) {
		if (selectedYear == null) {
			alert('Please select a project with vouchers first');
			return;
		}

		try {
            const yearlyPDFDataList: YearlyTaxPDFData[] = yearly.map((y) => ({
                project_code: y.project_code,
                gross: y.gross,
                taxed_amount: y.taxed_amount,
                net_amount: y.net_amount
            }));    
			await generateYearlyTaxPDF(yearlyPDFDataList, Number(selectedYear));
		} catch (error) {
			console.error('Error generating PDF:', error);
			alert('Error generating PDF. Make sure jsPDF library is loaded.');
		}
	}

	$effect(() => {
		if (startMonth > endMonth) {
				[startMonth, endMonth] = [endMonth, startMonth];
			}
	});
</script>

<div class="page-header">
	<h1 style="text-align: center;" class="page-title">
		Summary of Taxes
	</h1>

	<span class="text-gray-600/70">|</span>

	<div class="project-selector-wrapper">

		<!-- YEAR -->
		<div class="project-selector">
			<label for="project-select" class="sr-only">Select Year</label>
			<select id="project-select" class="project-select" bind:value={selectedYear}>
				<option value="">Select a Year...</option>
				{#each years as year}
					<option value={year}>{year}</option>
				{/each}
			</select>
		</div>

		<!-- START MONTH -->
		<div class="project-selector">
			<select class="project-select" bind:value={startMonth}>
				{#each months as month}
					<option value={month.value}>{month.label}</option>
				{/each}
			</select>
		</div>

		<span style="font-weight: 600; font-size: 1.2rem;">to</span>

		<!-- END MONTH -->
		<div class="project-selector">
			<select class="project-select" bind:value={endMonth}>
				{#each months as month}
					<option value={month.value}>{month.label}</option>
				{/each}
			</select>
		</div>

		
    </div>
	<span class="text-gray-600/70">|</span>
	<div class="project-selector-wrapper">
		<div class="project-selector">
			<input
				class="project-select"
				type="text"
				placeholder={`Search ${vouchers.length} payees...`}
				bind:value={searchName}
			/>
		</div>
	</div>
</div>

		<!-- PROJECT CODE -->
{#if selectedYear && Number(selectedYear) !== 0}

    <div class="project-selector">
        <label for="project-code-select" class="sr-only">Select Project Code</label>
        <select id="project-code-select" class="project-select" bind:value={selectedProjectCode}>
            <option value="">All Projects</option>
            {#each projects as project}
                <option value={project.code}>{project.code}</option>
            {/each}
        </select>
    </div>

    {#if loading}
        <div class="loading-indicator">
            <div class="spinner"></div>
            <span>Loading vouchers...</span>
        </div>

    {:else if yearly.length===0}
        <div class="no-data">
            <p>No vouchers found for this project.</p>
        </div>

    {:else}
        {#if selectedYear === null}
            <div class="no-selection">
                <p>Please select a year to view vouchers.</p>
            </div>

        {:else if selectedProjectCode === ''}
            <table style="text-align: center;" class="voucher-table border-2 border-green-800">
                <thead>
                    <tr>
                        <th>Project Code</th>
                        <th>Gross Amount</th>
                        <th>Tax (10%)</th>
                        <th>Net Amount</th>
                    </tr>
                </thead>

                <tbody>
                    {#each yearly as year}
                        <tr>
                            <td>{year.project_code}</td>
                            <td>₱{year.gross.toLocaleString()}</td>
                            <td>₱{year.taxed_amount.toLocaleString()}</td>
                            <td>₱{year.net_amount.toLocaleString()}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {:else}
            <table style="text-align: center;" class="voucher-table border-2 border-green-800">
                <thead>
                    <tr>
                        <th onclick={() => handleSort('date')}>Date</th>
                        <th onclick={() => handleSort('dv_no')}>DV No.</th>
                        <th onclick={() => handleSort('payee_name')}>Payee Name</th>
                        <th>Gross Amount</th>
                        <th>Tax (10%)</th>
                        <th>Net Amount</th>
                        <th>Remarks</th>
                    </tr>
                </thead>

                <tbody>
                    {#each sortedVouchers as voucher}
                        <tr>
                            <td>{new Date(voucher.date).toLocaleDateString()}</td>
                            <td>{voucher.dv_no}</td>
                            <td>{voucher.payee_name}</td>
                            <td>₱{voucher.gross.toLocaleString()}</td>
                            <td>₱{voucher.taxed_amount.toLocaleString()}</td>
                            <td>₱{voucher.net_amount.toLocaleString()}</td>
                            <td>{voucher.remarks}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    {/if}

{/if}

{#if selectedYear && Number(selectedYear) !== 0}
	<button class="pdf-button pdf-all" onclick={() => generateYearlyPDF(yearly)}>
		📄 Generate Annual Tax Summary
	</button>
{/if}

{#if selectedProjectCode}
	<button class="pdf-button pdf-all" onclick={() =>generateExcelProject(vouchers)}>
		📊 Generate Project Tax Summary
	</button>
	<button class="pdf-button pdf-all" onclick={() =>generateExcel(vouchers)}>
		📊 Generate Summary of Payees
	</button>
{/if}

<style>
	.page-header {
		display: flex;
		align-items: center;
		justify-content: start;
		margin-bottom: 1.5rem;
		margin-top: 1rem;
		gap: 1rem;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 700;
		color: oklch(44.8% 0.119 151.328); /* deep green */
		letter-spacing: -0.5px;
		margin: 0;
	}

	.project-selector {
		flex: 1 1 auto;
		min-width: 0;
		margin: 0.5rem;
	}

	.project-select {
		padding: 0.5rem 1rem;
		border: 2px solid oklch(44.8% 0.119 151.328);
		border-radius: 0.375rem;
		font-size: 1rem;
		background: white;
		color: #111;

		width: 100%;
		min-width: 0;
		max-width: 100%;
	}

	.project-select:focus {
		outline: none;
		border-color: oklch(34.389% 0.09873 148.331);
		box-shadow: 0 0 0 3px oklch(44.8% 0.119 151.328 / 0.1);
	}

	.loading-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 3rem;
		color: #666;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 3px solid #f3f3f3;
		border-top: 3px solid oklch(44.8% 0.119 151.328);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.no-data,
	.no-selection {
		text-align: center;
		padding: 3rem;
		color: #666;
		background: #f9f9f9;
		border-radius: 0.5rem;
		border: 2px dashed #ddd;
	}

	.voucher-table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 0;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.voucher-table th {
		background: oklch(44.8% 0.119 151.328); /* dark green */
		color: #fff;
		padding: 0.75rem 1rem;
		text-align: center;
		font-weight: 600;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.voucher-table td {
		background: #fff;
		color: #111;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e5e5e5;
		vertical-align: top;
	}

	.voucher-table tr:last-child td {
		border-bottom: none;
	}

	.voucher-table tr:hover td {
		background: #f8f9fa;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* PDF Generation Styles */
	.pdf-button {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.pdf-all {
		background: oklch(48.17% 0.1273 151.85);
		color: white;
		padding: 0.625rem 1.25rem;
		font-size: 0.9rem;
	}

	.pdf-all:hover {
		background: oklch(43.2% 0.1273 151.85);
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.project-selector-wrapper {
		display: flex;
		flex-direction: row;
		align-items: center;
	}
</style>

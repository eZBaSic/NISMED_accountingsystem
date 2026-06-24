<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import {
		generateVoucherPDF,
		generateMultipleVouchersPDF,
		type VoucherPDFData
	} from '$lib/pdfGenerator';
	import { generateYearlyTaxPDF, generateProjectTaxPDF, type YearlyTaxPDFData, type ProjectTaxPDFData } from '$lib/pdfGenerator_tax';

	// Project selection - expanded to include all fields needed for PDF
	let years: number[] = [];
	let selectedYear: number | null = null;

	let projects: any[] = [];
	let projectCodes: string[] = [];
	let selectedProjectId: number = 0;
    let selectedProjectCode: string = '';

	// Derived selected project and code
	$: flteredVouchers = selectedYear
		? vouchers.filter((v) => new Date(v.date).getFullYear() === selectedYear)
		: vouchers;

	$: selectedProject = projects.find((p) => p.id === selectedProjectId);
	$: selectedProjectCode = selectedProject ? selectedProject.code : '';

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

	interface VoucherRow {
		id: number;
		dv_no: string;
		date: string;
        gross: number;
		project_id: number;
		projects: {
			code: string;
		} | null;
	}

	let vouchers: VoucherWithDetails[] = []
    let yearly: YearlyWithDetails[] = []
	let loading: boolean = false;

	// Sorting state
	let sortField: 'dv_no' | 'payee_name' | 'date' | null = null;
	let sortDirection: 'asc' | 'desc' = 'asc';

	// Edit modal state
	let showEditModal = false;
	let editingVoucher: VoucherWithDetails | null = null;
	let editForm = {
		dv_no: '',
		date: '',
		gross: 0,
		has_tax_deduction: false,
		particulars: '',
		payment_mode: '',
		remarks: ''
	};

	// Computed sorted vouchers
	$: sortedVouchers = sortVouchers(vouchers, sortField, sortDirection);

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

	// Get sort icon for column header
	function getSortIcon(field: 'dv_no' | 'payee_name' | 'date'): string {
		if (sortField !== field) return '↕️';
		return sortDirection === 'asc' ? '↑' : '↓';
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
		if (!selectedYear) {
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
            console.log("YEARLY:", yearly);
            console.log("IS ARRAY:", Array.isArray(yearly));
            console.log("TYPE:", typeof yearly);    
			await generateYearlyTaxPDF(yearlyPDFDataList, selectedYear);
		} catch (error) {
			console.error('Error generating PDF:', error);
			alert('Error generating PDF. Make sure jsPDF library is loaded.');
		}
	}

	// Load projects
	async function load_years() {
		try {
			const { data, error } = await supabase
				.from('vouchers')
				.select('date')
				.eq('has_tax_deduction', false);

			if (error) throw error;

			years = [
				...new Set(
					(data ?? [])
						.map((v) => v.date && new Date(v.date).getFullYear())
						.filter((y): y is number => typeof y === 'number')
				)
			].sort((a, b) => b - a);
		} catch (error) {
			console.error('Error loading years:', error);
			years = [];
		}
	}

	async function load_vouchers_by_year() {
        if (selectedYear === null || selectedYear === 0) {
            yearly = [];
            projectCodes = [];
            return;
        }

		try {
            const year = selectedYear;
			const startDate = `${year}-01-01`;
			const endDate = `${year}-12-31`;

			const { data, error } = await supabase
				.from('vouchers')
				.select(
					`
            id,
            dv_no,
            date,
            gross,
            project_id,
            projects ( code )
        `
				)
                .eq('has_tax_deduction', false)
				.gte('date', startDate)
				.lte('date', endDate);

			if (error) throw error;

			const raw: VoucherRow[] = data ?? [];

            projectCodes = [...new Set(
                raw.map(v => v.projects?.code).filter((c): c is string => !!c)
            )];

            const yearlyMap: Record<string, any> = {};

            console.log('RAW:', raw);
            for (const v of raw){
                const key  = `${v.project_id}`;

                if (!yearlyMap[key]) {
                yearlyMap[key] = {
                    project_code: v.projects?.code,
                    total_gross: 0,
                    taxed_amount: 0,
                    net_amount: 0
                };
                console.log('gross:', v.gross);
            }          
            yearlyMap[key].total_gross += v.gross;
            yearly = Object.values(yearlyMap).map((v: any) => ({
                project_code: v.project_code,
                gross: v.total_gross,
                taxed_amount: v.total_gross * 0.1,
                net_amount: v.total_gross - v.total_gross * 0.1
            }));

                console.log('YEARLY:', yearly); // Print Test

		} 
    }
        catch (error) {
			console.error(error);
		}
	}
    

	// Load vouchers for selected project
    async function load_vouchers() {

        loading = true;
        try {   
        const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('id')
            .eq('code', selectedProjectCode)
            .single();

        if (projectError) {
            console.error(projectError);
        } else {
            selectedProjectId = projectData.id;
        }
        const startDate = `${selectedYear}-01-01`;
		const endDate = `${selectedYear}-12-31`;

        const { data: voucherData, error: voucherError } = await supabase
            .from('vouchers')
            .select(`
            id,
            dv_no,
            date,
            gross,
            particulars,
            remarks,
            payees!inner (
                name,
                tin_id
            )
            `)
            .eq('project_id', selectedProjectId)
            .eq('has_tax_deduction', false)
            .gte('date', startDate)
			.lte('date', endDate)
            .order('dv_no');
        
        if (voucherError) throw voucherError;
        
        // Transform the data to flatten the payee information
        vouchers = (voucherData ?? []).map((v: any) => ({
            id: v.id,
            dv_no: v.dv_no,
            payee_name: v.payees?.name || 'Unknown',
            payee_tin_id: v.payees?.tin_id || '',
            date: v.date,
            gross: v.gross,
            particulars: v.particulars,
            remarks: v.remarks || '',
            taxed_amount: v.gross*0.10,
            net_amount: v.gross - (v.gross*0.10)

        }));

        console.log('Vouchers:', vouchers);

        } catch (error) {
        console.error('Error loading vouchers:', error);
        alert('Error loading vouchers');
        vouchers = [];
        } finally {
        loading = false;
        }
    }

	// Reactive loading when project changes
	$: if (selectedYear) {
		load_vouchers_by_year();
	}

    $: if (selectedProjectCode!== undefined) {
        if(selectedProjectCode == ''){load_vouchers_by_year();}
		else{load_vouchers();}
	}

	onMount(async () => {
		await load_years();
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
    </div>
</div>

		<!-- PROJECT CODE -->
{#if selectedYear && selectedYear !== 0}

    <div class="project-selector">
        <label for="project-code-select" class="sr-only">Select Project Code</label>
        <select id="project-code-select" class="project-select" bind:value={selectedProjectCode}>
            <option value="">All Projects</option>
            {#each projectCodes as code}
                <option value={code}>{code}</option>
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
                        <th on:click={() => handleSort('date')}>Date</th>
                        <th on:click={() => handleSort('dv_no')}>DV No.</th>
                        <th on:click={() => handleSort('payee_name')}>Payee Name</th>
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

{#if selectedYear && selectedYear !== 0}
	<button class="pdf-button pdf-all" on:click={() => generateYearlyPDF(yearly)}>
		📄 Generate Annual Tax Summary
	</button>
{/if}

{#if selectedProjectCode}
	<button class="pdf-button pdf-all" on:click={() =>generateProjectPDF(vouchers)}>
		📄 Generate Project Tax Summary
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

	.project-info {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: oklch(44.8% 0.119 151.328 / 0.05);
		border-left: 4px solid oklch(44.8% 0.119 151.328);
		border-radius: 0.375rem;
	}

	.project-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: oklch(44.8% 0.119 151.328);
		margin: 0 0 0.5rem 0;
	}

	.voucher-count {
		color: #666;
		margin: 0;
		font-size: 0.875rem;
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

	.sortable-header {
		cursor: pointer;
		user-select: none;
		transition: background-color 0.2s ease;
		position: relative;
	}

	.sortable-header:hover {
		background: oklch(34.389% 0.09873 148.331) !important;
	}

	.sort-icon {
		margin-left: 0.5rem;
		font-size: 0.875rem;
		opacity: 0.8;
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

	.tax-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.tax-yes {
		background: #fee2e2;
		color: #dc2626;
	}

	.tax-no {
		background: #f0f9ff;
		color: #0284c7;
	}

	.particulars {
		max-width: 200px;
		word-wrap: break-word;
	}

	.payment-mode {
		font-size: 0.875rem;
		font-weight: 500;
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

	.pdf-single {
		background: #f59e0b;
		color: white;
		padding: 0.375rem 0.75rem;
		font-size: 0.8rem;
	}

	.pdf-single:hover {
		background: #d97706;
		transform: translateY(-1px);
	}

	.actions {
		text-align: center;
		width: 140px;
	}

	.actions .pdf-button,
	.actions .delete-button {
		width: 100%;
		justify-content: center;
		margin-bottom: 0.25rem;
	}

	.actions .pdf-button:last-child,
	.actions .delete-button:last-child {
		margin-bottom: 0;
	}

	/* Delete Button Styles */
	.delete-button {
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
	}

	.delete-single {
		background: #ef4444;
		color: white;
		padding: 0.375rem 0.75rem;
		font-size: 0.8rem;
	}

	.delete-single:hover {
		background: #dc2626;
		transform: translateY(-1px);
	}

	/* Edit Button Styles */
	.edit-button {
		background: #3b82f6;
		color: white;
		padding: 0.375rem 0.75rem;
		font-size: 0.8rem;
		border-radius: 0.375rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		justify-content: center;
		margin-bottom: 0.25rem;
	}

	.edit-button:hover {
		background: #2563eb;
		transform: translateY(-1px);
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		padding: 2rem;
		border-radius: 0.5rem;
		width: 90%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
	}

	.modal-content h2 {
		margin: 0 0 1.5rem 0;
		color: #1f2937;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #374151;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		transition: border-color 0.2s ease;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-group input[type='checkbox'] {
		width: auto;
		margin-right: 0.5rem;
	}

	.modal-buttons {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	.cancel-button,
	.save-button {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
	}

	.cancel-button {
		background: #6b7280;
		color: white;
	}

	.cancel-button:hover {
		background: #4b5563;
	}

	.save-button {
		background: #059669;
		color: white;
	}

	.save-button:hover {
		background: #047857;
	}
</style>

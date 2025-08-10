<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from "$lib/supabaseClient";

  // Project selection
  let projects: { id: number, code: string, title: string }[] = [];
  let selectedProjectId: number = 0;

  // Derived selected project and code
  $: selectedProject = projects.find(p => p.id === selectedProjectId);
  $: selectedProjectCode = selectedProject ? selectedProject.code : '';

  // Voucher data with proper joins
  interface VoucherWithDetails {
    id: number;
    dv_no: string;
    payee_name: string;
    payee_address: string;
    date: string;
    nth_yearly_voucher: number;
    gross: number;
    has_tax_deduction: boolean;
    particulars: string;
    payment_mode: string;
    remarks: string;
  }

  let vouchers: VoucherWithDetails[] = [];
  let loading: boolean = false;

  // Load projects
  async function load_projects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, code, title')
        .order('code');
      
      if (error) throw error;
      projects = data ?? [];
      
      // Auto-select first project if available
      if (projects.length > 0) {
        selectedProjectId = projects[0].id;
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      alert('Error loading projects');
      projects = [];
    }
  }

  // Load vouchers for selected project
  async function load_vouchers() {
    if (!selectedProjectId || selectedProjectId === 0) {
      vouchers = [];
      return;
    }

    loading = true;
    try {
      const { data, error } = await supabase
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
          payees!inner (
            name,
            address
          )
        `)
        .eq('project_id', selectedProjectId)
        .order('dv_no');
      
      if (error) throw error;
      
      // Transform the data to flatten the payee information
      vouchers = (data ?? []).map((v: any) => ({
        id: v.id,
        dv_no: v.dv_no,
        payee_name: v.payees?.name || 'Unknown',
        payee_address: v.payees?.address || '',
        date: v.date,
        nth_yearly_voucher: v.nth_yearly_voucher,
        gross: v.gross,
        has_tax_deduction: v.has_tax_deduction,
        particulars: v.particulars,
        payment_mode: v.payment_mode,
        remarks: v.remarks || ''
      }));
    } catch (error) {
      console.error('Error loading vouchers:', error);
      alert('Error loading vouchers');
      vouchers = [];
    } finally {
      loading = false;
    }
  }

  // Reactive loading when project changes
  $: if (selectedProjectId) {
    load_vouchers();
  }

  onMount(async () => {
    await load_projects();
  });
</script>

<div class="page-header">
  <h1 class="page-title">Reports</h1>
  <span class="text-gray-600/70">|</span>
  <div class="project-selector">
    <label for="project-select" class="sr-only">Select Project</label>
    <select id="project-select" class="project-select" bind:value={selectedProjectId}>
      <option value={0}>Select a project...</option>
      {#each projects as project}
        <option value={project.id}>{project.code} - {project.title}</option>
      {/each}
    </select>
  </div>
</div>

{#if selectedProjectId && selectedProjectId !== 0}
  <div class="project-info">
    <h2 class="project-title">Project: {selectedProjectCode} - {selectedProject?.title}</h2>
    <p class="voucher-count">
      {#if loading}
        Loading vouchers...
      {:else}
        Showing {vouchers.length} voucher{vouchers.length !== 1 ? 's' : ''}
      {/if}
    </p>
  </div>

  {#if loading}
    <div class="loading-indicator">
      <div class="spinner"></div>
      <span>Loading vouchers...</span>
    </div>
  {:else if vouchers.length === 0}
    <div class="no-data">
      <p>No vouchers found for this project.</p>
    </div>
  {:else}
    <table class="voucher-table border-2 border-green-800">
      <thead>
        <tr>
          <th>DV No.</th>
          <th>Payee Name</th>
          <th>Address</th>
          <th>Date</th>
          <th>Nth Yearly</th>
          <th>Gross Amount</th>
          <th>Tax Deduction</th>
          <th>Particulars</th>
          <th>Payment Mode</th>
          <th>Remarks</th>
        </tr>
      </thead>
      <tbody>
        {#each vouchers as voucher}
          <tr>
            <td class="font-medium">{voucher.dv_no}</td>
            <td>{voucher.payee_name}</td>
            <td class="text-sm text-gray-600">{voucher.payee_address}</td>
            <td>{new Date(voucher.date).toLocaleDateString()}</td>
            <td class="text-center">{voucher.nth_yearly_voucher}</td>
            <td class="text-right font-medium">₱{voucher.gross.toLocaleString()}</td>
            <td class="text-center">
              <span class="tax-badge {voucher.has_tax_deduction ? 'tax-yes' : 'tax-no'}">
                {voucher.has_tax_deduction ? 'Yes' : 'No'}
              </span>
            </td>
            <td class="particulars">{voucher.particulars}</td>
            <td class="payment-mode">{voucher.payment_mode}</td>
            <td class="text-sm text-gray-600">{voucher.remarks}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
{:else}
  <div class="no-selection">
    <p>Please select a project to view its vouchers.</p>
  </div>
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
  display: flex;
  align-items: center;
}

.project-select {
  padding: 0.5rem 1rem;
  border: 2px solid oklch(44.8% 0.119 151.328);
  border-radius: 0.375rem;
  font-size: 1rem;
  background: white;
  color: #111;
  min-width: 300px;
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-data, .no-selection {
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
  text-align: left;
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
</style>

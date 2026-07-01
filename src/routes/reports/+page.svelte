<script lang="ts">
  import { generateVoucherPDF, generateMultipleVouchersPDF, type VoucherPDFData } from "$lib/pdfGenerator";
  import { goto } from '$app/navigation';


  let { data } = $props();

  let projects = $derived(data.projects);
  let vouchers = $derived(data.vouchers);

  let selectedProjectId = $derived(
    data.selectedProjectId
  );

  // Derived selected project and code
  const selectedProject = $derived(
    projects.find((p: any) => p.id === selectedProjectId)
  );

  const selectedProjectCode = $derived(selectedProject?.code);

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

  let loading: boolean = false;

  // Sorting state
  let sortField: 'dv_no' | 'payee_name' | 'date' | null = $state(null);
  let sortDirection: 'asc' | 'desc' = $state('asc');

  // Edit modal state
  let showEditModal = $state(false);
  let editingVoucher: VoucherWithDetails | null = $state(null);
  let editForm = $state({
    dv_no: '',
    date: '',
    gross: 0,
    has_tax_deduction: false,
    particulars: '',
    payment_mode: '',
    remarks: ''
  });

  // Computed sorted vouchers
  const sortedVouchers = $derived(
    sortVouchers(vouchers, sortField, sortDirection)
  );

  // Sorting function
  function sortVouchers(rows: VoucherWithDetails[], field: 'dv_no' | 'payee_name' | 'date' | null, direction: 'asc' | 'desc'): VoucherWithDetails[] {
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
  async function generateSingleVoucherPDF(voucher: VoucherWithDetails) {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }

    try {
      const voucherPDFData: VoucherPDFData = {
        id: voucher.id,
        dv_no: voucher.dv_no,
        payee_name: voucher.payee_name,
        payee_address: voucher.payee_address,
        date: voucher.date,
        gross: voucher.gross,
        has_tax_deduction: voucher.has_tax_deduction,
        particulars: voucher.particulars,
        payment_mode: voucher.payment_mode,
        remarks: voucher.remarks,
        project_code: selectedProject.code,
        project_title: selectedProject.title,
        authorized_rep: selectedProject.authorized_rep,
        approver: selectedProject.approver
      };

      await generateVoucherPDF(voucherPDFData);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Make sure jsPDF library is loaded.');
    }
  }

  async function generateAllVouchersPDF() {
    if (!selectedProject || sortedVouchers.length === 0) {
      alert('Please select a project with vouchers first');
      return;
    }

    try {
      const voucherPDFDataList: VoucherPDFData[] = sortedVouchers.map(voucher => ({
        id: voucher.id,
        dv_no: voucher.dv_no,
        payee_name: voucher.payee_name,
        payee_address: voucher.payee_address,
        date: voucher.date,
        gross: voucher.gross,
        has_tax_deduction: voucher.has_tax_deduction,
        particulars: voucher.particulars,
        payment_mode: voucher.payment_mode,
        remarks: voucher.remarks,
        project_code: selectedProject.code,
        project_title: selectedProject.title,
        authorized_rep: selectedProject.authorized_rep,
        approver: selectedProject.approver
      }));

      await generateMultipleVouchersPDF(voucherPDFDataList, selectedProject.title);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Make sure jsPDF library is loaded.');
    }
  }


  // Edit Voucher Functions
  function openEditModal(voucher: VoucherWithDetails) {
    editingVoucher = voucher;
    editForm = {
      dv_no: voucher.dv_no,
      date: voucher.date,
      gross: voucher.gross,
      has_tax_deduction: voucher.has_tax_deduction,
      particulars: voucher.particulars,
      payment_mode: voucher.payment_mode,
      remarks: voucher.remarks
    };
    showEditModal = true;
  }

  function closeEditModal() {
    showEditModal = false;
    editingVoucher = null;
    editForm = {
      dv_no: '',
      date: '',
      gross: 0,
      has_tax_deduction: false,
      particulars: '',
      payment_mode: '',
      remarks: ''
    };
  }

  async function changeProject(id: number) {
    await goto(`?project=${id}`, {
      invalidateAll: true
    });
  }

</script>

<div class="page-header">
  <h1 class="page-title">Reports</h1>
  <span class="text-gray-600/70">|</span>
  <div class="project-selector">
    <label for="project-select" class="sr-only">Select Project</label>
    <select id="project-select" class="project-select" bind:value={selectedProjectId} onchange={(e) => changeProject(Number(e.currentTarget.value))}>
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
        {#if sortField}
          • Sorted by {sortField === 'dv_no' ? 'DV Number' : sortField === 'payee_name' ? 'Payee Name' : 'Date'} ({sortDirection === 'asc' ? 'ascending' : 'descending'})
        {/if}
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
    
    <button class="pdf-button pdf-all" onclick={generateAllVouchersPDF}>
      📄 Generate All Vouchers PDF
    </button>
    
    <table class="voucher-table border-2 border-green-800">
      <thead>
        <tr>
          <th class="sortable-header" onclick={() => handleSort('dv_no')} title="Click to sort by DV Number">
            DV No. <span class="sort-icon">{getSortIcon('dv_no')}</span>
          </th>
          <th class="sortable-header" onclick={() => handleSort('payee_name')} title="Click to sort by Payee Name">
            Payee Name <span class="sort-icon">{getSortIcon('payee_name')}</span>
          </th>
          <th>Address</th>
          <th class="sortable-header" onclick={() => handleSort('date')} title="Click to sort by Date">
            Date <span class="sort-icon">{getSortIcon('date')}</span>
          </th>
          <th>Nth Yearly</th>
          <th>Gross Amount</th>
          <th>Tax Deduction</th>
          <th>Particulars</th>
          <th>Payment Mode</th>
          <th>Remarks</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each sortedVouchers as voucher}
          <tr>
            <td style="text-align: center;" class="font-medium">{voucher.dv_no}</td>
            <td style="text-align: center;">{voucher.payee_name}</td>
            <td style="text-align: center;" class="text-sm text-gray-600">{voucher.payee_address}</td>
            <td style="text-align: center;">{new Date(voucher.date).toLocaleDateString()}</td>
            <td class="text-center">{voucher.nth_yearly_voucher}</td>
            <td class="text-center">₱{voucher.gross.toLocaleString()}</td>
            <td class="text-center">
              <span class="tax-badge {voucher.has_tax_deduction ? 'tax-yes' : 'tax-no'}">
                {voucher.has_tax_deduction ? 'Yes' : 'No'}
              </span>
            </td>
            <td style="text-align: center;" class="particulars">{voucher.particulars} </td>
            <td style="text-align: center;" class="payment-mode">{voucher.payment_mode}</td>
            <td style="text-align: center;" class="text-sm text-gray-600">{voucher.remarks}</td>
            <td class="actions">
              <button class="pdf-button pdf-single" onclick={() => generateSingleVoucherPDF(voucher)} title="Generate PDF for this voucher">
                📄 PDF
              </button>
              <button class="edit-button" onclick={() => openEditModal(voucher)} title="Edit this voucher">
                ✏️ Edit
              </button>
              <form method="POST" action="?/deleteVoucher">
                <input type="hidden" name="id"
                  value={voucher.id}
                />
                <button type="submit" class="delete-button delete-single">
                  🗑️ Delete
                </button>
              </form>
            </td>
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

<!-- Edit Modal -->
{#if showEditModal && editingVoucher}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title" tabindex="-1" onclick={closeEditModal} onkeydown={(e) => e.key === 'Escape' && closeEditModal()}>
    <div
      class="modal-content"
      role="presentation"
      onclick={(e) => {
        e.stopPropagation();
      }} 
      onkeydown={(e) => {
        e.stopPropagation();
      }}
    >
      <h2 id="edit-modal-title">Edit Voucher</h2>
      <form method="POST" action="?/updateVoucher">
        <div class="form-group">
          <input
            type="hidden"
            name="id"
            value={editingVoucher.id}
          />

          <label for="edit-dv-no">DV Number:</label>
          <input 
            id="edit-dv-no"
            name="dv_no"
            type="text" 
            bind:value={editForm.dv_no}
            required 
          />
        </div>

        <div class="form-group">
          <label for="edit-date">Date:</label>
          <input 
            id="edit-date"
            name="date"
            type="date" 
            bind:value={editForm.date}
            required 
          />
        </div>

        <div class="form-group">
          <label for="edit-gross">Gross Amount:</label>
          <input 
            id="edit-gross"
            name="gross"
            type="number" 
            step="0.01"
            bind:value={editForm.gross}
            required 
          />
        </div>

        <div class="form-group">
          <label for="edit-tax-deduction">
            <input 
              id="edit-tax-deduction"
              name="has_tax_deductions"
              type="checkbox" 
              bind:checked={editForm.has_tax_deduction}
            />
            Has Tax Deduction
          </label>
        </div>

        <div class="form-group">
          <label for="edit-particulars">Particulars:</label>
          <textarea 
            id="edit-particulars"
            name="particulars"
            bind:value={editForm.particulars}
            rows="3"
            required
          ></textarea>
        </div>

        <div class="form-group">
          <label for="edit-payment-mode">Payment Mode:</label>
          <input 
            id="edit-payment-mode"
            name="payment_mode"
            type="text" 
            bind:value={editForm.payment_mode}
            required 
          />
        </div>

        <div class="form-group">
          <label for="edit-remarks">Remarks:</label>
          <textarea 
            id="edit-remarks"
            name="remarks"
            bind:value={editForm.remarks}
            rows="2"
          ></textarea>
        </div>

        <div class="modal-buttons">
          <button type="button" class="cancel-button" onclick={closeEditModal}>
            Cancel
          </button>
          <button type="submit" class="save-button">
            Save Changes
          </button>
        </div>
      </form>
    </div>
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

.form-group input[type="checkbox"] {
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

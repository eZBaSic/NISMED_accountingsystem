<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from "$lib/supabaseClient";


  // Project selection
  let projects: { id: number, code: string, title: string }[] = [];
  let selectedProjectId: number = 0;

// Derived selected project and code
$: selectedProject = projects.find(p => p.id === selectedProjectId);
$: selectedProjectCode = selectedProject ? selectedProject.code : '';

// Editable voucher rows
let voucherRows: voucher_entry[] = [];

// Sorting state
let sortField: 'dv_no' | 'name' | 'date' | null = null;
let sortDirection: 'asc' | 'desc' = 'asc';

// Loading states for save operations
let savingRow: boolean = false;
let savingAll: boolean = false;

// When selectedProjectId changes, update all voucherRows' project_id to selectedProjectCode
$: if (voucherRows.length && selectedProjectCode) {
  voucherRows = voucherRows.map(row => ({ ...row, project_id: selectedProjectCode }));
}

// Computed sorted voucher rows
$: sortedVoucherRows = sortVoucherRows(voucherRows, sortField, sortDirection);

  // Helper for today's date
  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function this_year() {
    return new Date().getFullYear().toString().slice(-2)
  }

  // Sorting functions
  function sortVoucherRows(rows: voucher_entry[], field: 'dv_no' | 'name' | 'date' | null, direction: 'asc' | 'desc'): voucher_entry[] {
    if (!field) return rows;
    
    return [...rows].sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;
      
      switch (field) {
        case 'dv_no':
          valueA = a.dv_no.toLowerCase();
          valueB = b.dv_no.toLowerCase();
          break;
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
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

  function handleSort(field: 'dv_no' | 'name' | 'date') {
    if (sortField === field) {
      // Toggle direction if same field
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new field and default to ascending
      sortField = field;
      sortDirection = 'asc';
    }
  }

  function getSortIcon(field: 'dv_no' | 'name' | 'date'): string {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  }

  // Helper function to get original index from sorted array
  function getOriginalIndex(row: voucher_entry): number {
    return voucherRows.findIndex(originalRow => 
      originalRow.dv_no === row.dv_no && 
      originalRow.name === row.name && 
      originalRow.date === row.date
    );
  }

  // Load projects for dropdown
  async function load_projects() {
    const { data, error } = await supabase.from('projects').select('id, code, title');
    projects = data ?? [];
    if (projects.length > 0) selectedProjectId = projects[0].id;
  }

  // Add a new empty row
  function addRow() {
    const selectedProject = projects.find(p => p.id === selectedProjectId)
    const selectedProjectTitle = selectedProject ? selectedProject.title : ''
    
    voucherRows = [
      ...voucherRows,
      {
        dv_no: `${selectedProjectCode}-${this_year()}-`,
        name: '',
        address: '',
        project_id: selectedProjectCode,
        date: today(),
        gross: 0,
        tax: false,
        particulars: '',
        payment_mode: '',
        remarks: ''
      }
    ];
  }

  // Save a single voucher row
  async function saveVoucherRow(row: voucher_entry, idx: number) {
    if (savingRow) return; // Prevent multiple simultaneous saves
    savingRow = true;
    
    try {
      // Validate required fields
      if (!row.dv_no || !row.name || !row.date || !selectedProjectId || selectedProjectId === 0) {
        alert('Please fill in all required fields (DV No, Name, Date) and select a project.');
        return;
      }

      // First, upsert the payee
      const { data: payeeData, error: payeeError } = await supabase
        .from('payees')
        .upsert({
          name: row.name,
          address: row.address || '',
        })
        .select('id')
        .single();
      
      if (payeeError) throw payeeError;

      // Get the project ID (already a number)
      const projectId = selectedProjectId;
      
      // Calculate nth_yearly_voucher by counting existing vouchers for this year and project
      const currentYear = new Date(row.date).getFullYear();
      const { count, error: countError } = await supabase
        .from('vouchers')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .gte('date', `${currentYear}-01-01`)
        .lte('date', `${currentYear}-12-31`);
      
      if (countError) throw countError;
      const nthVoucher = (count || 0) + 1;
      
      // Prepare voucher data
      const voucherData = {
        dv_no: row.dv_no,
        payee_id: payeeData.id,
        project_id: projectId,
        date: row.date,
        nth_yearly_voucher: nthVoucher,
        gross: row.gross,
        has_tax_deduction: row.tax,
        particulars: row.particulars,
        payment_mode: row.payment_mode,
        remarks: row.remarks || null
      };

      const { error: voucherError } = await supabase
        .from('vouchers')
        .insert(voucherData);
      
      if (voucherError) throw voucherError;
      alert('Voucher saved successfully!');
      
      // Remove the saved row from the table
      voucherRows = voucherRows.filter((_, i) => i !== idx);
    } catch (e: any) {
      console.error('Error saving voucher:', e);
      alert(`Error saving voucher: ${e?.message || 'Unknown error'}`);
    } finally {
      savingRow = false;
    }
  }

  // Save all voucher rows
  async function saveAllVouchers() {
    if (savingAll) return; // Prevent multiple simultaneous saves
    savingAll = true;
    
    try {
      // Validate that we have vouchers to save and a project selected
      if (voucherRows.length === 0) {
        alert('No vouchers to save.');
        return;
      }
      
      if (!selectedProjectId || selectedProjectId === 0) {
        alert('Please select a project before saving vouchers.');
        return;
      }

      // Validate all rows have required fields
      for (let i = 0; i < voucherRows.length; i++) {
        const row = voucherRows[i];
        if (!row.dv_no || !row.name || !row.date) {
          alert(`Row ${i + 1}: Please fill in all required fields (DV No, Name, Date).`);
          return;
        }
      }

      const projectId = selectedProjectId;
      
      // Get current year's voucher count for proper nth_yearly_voucher calculation
      const currentYear = new Date().getFullYear();
      const { count: existingCount, error: countError } = await supabase
        .from('vouchers')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .gte('date', `${currentYear}-01-01`)
        .lte('date', `${currentYear}-12-31`);
      
      if (countError) throw countError;
      let voucherCounter = (existingCount || 0);

      for (let i = 0; i < voucherRows.length; i++) {
        const row = voucherRows[i];
        
        // Upsert the payee
        const { data: payeeData, error: payeeError } = await supabase
          .from('payees')
          .upsert({
            name: row.name,
            address: row.address || '',
          })
          .select('id')
          .single();
        
        if (payeeError) throw payeeError;

        voucherCounter++;
        
        // Prepare voucher data
        const voucherData = {
          dv_no: row.dv_no,
          payee_id: payeeData.id,
          project_id: projectId,
          date: row.date,
          nth_yearly_voucher: voucherCounter,
          gross: row.gross,
          has_tax_deduction: row.tax,
          particulars: row.particulars,
          payment_mode: row.payment_mode,
          remarks: row.remarks || null
        };

        const { error: voucherError } = await supabase
          .from('vouchers')
          .insert(voucherData);
        
        if (voucherError) throw voucherError;
      }
      
      alert(`All ${voucherRows.length} vouchers saved successfully!`);
      voucherRows = [];
    } catch (e: any) {
      console.error('Error saving vouchers:', e);
      alert(`Error saving vouchers: ${e?.message || 'Unknown error'}`);
    } finally {
      savingAll = false;
    }
  }

  // Update a field in a row
  function updateRow(sortedIdx: number, key: string, value: any) {
    const row = sortedVoucherRows[sortedIdx];
    const originalIdx = getOriginalIndex(row);
    
    if (originalIdx !== -1) {
      voucherRows = voucherRows.map((row, i) =>
        i === originalIdx ? { ...row, [key]: value } : row
      );
    }
  }

  // Delete a row from the table
  function deleteRow(idx: number) {
    voucherRows = voucherRows.filter((_, i) => i !== idx);
  }

  onMount(async () => {
    await load_projects();
    addRow();
  });
</script>

<div class="page-header">
  <h1 class="page-title">Add Vouchers</h1>
  <div class="header-actions">
    <select class="project-select" bind:value={selectedProjectId}>
      {#each projects as p}
        <option value={p.id}>{p.code}</option>
      {/each}
    </select>

    <span class="text-gray-600/70">|</span>
    
    {#if sortField}
      <button class="sort-reset-btn" on:click={() => { sortField = null; sortDirection = 'asc'; }}>
        Clear Sort
      </button>
      <span class="text-gray-600/70">|</span>
    {/if}
    
    <button 
      class="save-all-btn bg-blue-500 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" 
      on:click={saveAllVouchers}
      disabled={savingAll || voucherRows.length === 0}
    >
      {savingAll ? 'Saving All...' : `Save All (${voucherRows.length})`}
    </button>
  </div>
</div>

<table class="voucher-table border-2 border-green-800">
  <thead>
    <tr>
      <th class="sortable" on:click={() => handleSort('dv_no')} title="Click to sort by DV Number">
        DV No. <span class="sort-icon">{getSortIcon('dv_no')}</span>
      </th>
      <th class="sortable" on:click={() => handleSort('name')} title="Click to sort by Name">
        Name <span class="sort-icon">{getSortIcon('name')}</span>
      </th>
      <th>Address</th>
      <th class="sortable" on:click={() => handleSort('date')} title="Click to sort by Date">
        Date <span class="sort-icon">{getSortIcon('date')}</span>
      </th>
      <th>Gross (PHP)</th>
      <th>Tax</th>
      <th>Particulars</th>
      <th>Mode</th>
      <th>Remarks</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each sortedVoucherRows as row, idx}
      <tr>
        <td><input type="text" value={row.dv_no} on:input={e => updateRow(idx, 'dv_no', (e.target as HTMLInputElement).value)} /></td>
        <td><input type="text" value={row.name} on:input={e => updateRow(idx, 'name', (e.target as HTMLInputElement).value)} /></td>
        <td><input type="text" value={row.address} on:input={e => updateRow(idx, 'address', (e.target as HTMLInputElement).value)} /></td>
        <td><input type="date" value={row.date} on:input={e => updateRow(idx, 'date', (e.target as HTMLInputElement).value)} /></td>
        <td><input type="number" min="0" step="500" value={row.gross} on:input={e => updateRow(idx, 'gross', +(e.target as HTMLInputElement).value)} /></td>
        <td><input type="checkbox" checked={row.tax} on:change={e => updateRow(idx, 'tax', (e.target as HTMLInputElement).checked)} /></td>
        <td><input type="text" value={row.particulars} on:input={e => updateRow(idx, 'particulars', (e.target as HTMLInputElement).value)} /></td>
        <td>
          <select value={row.payment_mode} on:change={e => updateRow(idx, 'payment_mode', (e.target as HTMLSelectElement).value)} class="mode-select">
            <option value="">Select</option>
            <option value="Cash">Cash</option>
            <option value="Online Payment">Online Payment</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </td>
        <td><input type="text" value={row.remarks} on:input={e => updateRow(idx, 'remarks', (e.target as HTMLInputElement).value)} /></td>
        <td class="space-x-1">
          <button 
            class="text-blue-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed" 
            on:click={() => saveVoucherRow(row, getOriginalIndex(row))}
            disabled={savingRow}
          >
            {savingRow ? 'Saving...' : 'Save'}
          </button>
          <button class="text-red-500 hover:underline" on:click={() => deleteRow(getOriginalIndex(row))}>Delete</button>
        </td>
      </tr>
    {/each}
    <tr>
      <td colspan="10" style="text-align:center;">
        <button class="add-row-btn" on:click={addRow}>+ Add Row</button>
      </td>
    </tr>
  </tbody>
</table>

<style>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.project-select {
  background: oklch(98% 0.01 151.328); /* very light green, almost white */
  color: #1a3a1a; /* dark green text */
  font-size: 1rem;
  font-weight: 500;
  border: 2px solid oklch(44.8% 0.119 151.328);
  border-radius: 0.4rem;
  padding: 0rem 1.0rem;
  box-shadow: 0 1px 4px 0 rgba(44, 62, 80, 0.04);
  outline: none;
  transition: background 0.15s, border 0.15s;
  height: 2.5rem;
}
.project-select:focus {
  background: oklch(94% 0.01 151.328);
  border-color: oklch(34.389% 0.09873 148.331);
}

.mode-select {
  background: #f9fafb;
  color: #222;
  font-size: 0.92rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.3rem;
  padding: 0.15rem 0.3rem;
  width: 100%;
}

.add-row-btn {
  background: oklch(49.213% 0.13198 151.157); /* dark green */
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: background 0.15s;
  height: 2.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.save-all-btn {
  /* background: oklch(36.125% 0.02679 161.677);  */
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: background 0.15s;
  height: 2.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.sort-reset-btn {
  background: oklch(0.7 0.05 25); /* neutral gray */
  color: #333;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.3rem;
  cursor: pointer;
  transition: background 0.15s;
  height: 2.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.sort-reset-btn:hover {
  background: oklch(0.65 0.05 25);
}

.add-row-btn:hover {
  background: oklch(43.25% 0.12662 147.579);
}

.voucher-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0;
  font-size: 0.78rem;
  table-layout: fixed;
}

/* Set different column widths for different data types */
.voucher-table th:nth-child(1), /* DV No. */
.voucher-table td:nth-child(1) {
  width: 15%;
}
.voucher-table th:nth-child(2), /* Name */
.voucher-table td:nth-child(2) {
  width: 13%;
}
.voucher-table th:nth-child(3), /* Address */
.voucher-table td:nth-child(3) {
  width: 18%;
}
.voucher-table th:nth-child(4), /* Date */
.voucher-table td:nth-child(4) {
  width: 10%;
}
.voucher-table th:nth-child(5), /* Gross */
.voucher-table td:nth-child(5) {
  width: 10%;
}
.voucher-table th:nth-child(6), /* Tax */
.voucher-table td:nth-child(6) {
  width: 6%;
}
.voucher-table th:nth-child(7), /* Particulars */
.voucher-table td:nth-child(7) {
  width: 15%;
}
.voucher-table th:nth-child(8), /* Mode */
.voucher-table td:nth-child(8) {
  width: 10%;
}
.voucher-table th:nth-child(9), /* Remarks */
.voucher-table td:nth-child(9) {
  width: 15%;
}
.voucher-table th:nth-child(10), /* Actions */
.voucher-table td:nth-child(10) {
  width: 15%;
}

.voucher-table th, .voucher-table td {
  padding: 0.35rem 0.4rem;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.voucher-table th {
  background: oklch(44.8% 0.119 151.328); /* dark green */
  color: #fff;
  text-align: left;
}

.voucher-table th.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
  transition: background-color 0.2s ease;
}

.voucher-table th.sortable:hover {
  background: oklch(34.389% 0.09873 148.331); /* darker green on hover */
}

.voucher-table th.sortable:active {
  background: oklch(30% 0.08 148.331); /* even darker when clicked */
}

.sort-icon {
  margin-left: 0.25rem;
  font-size: 0.9rem;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.voucher-table th.sortable:hover .sort-icon {
  opacity: 1;
  font-weight: bold;
}

.voucher-table td {
  background: #fff;
  color: #111;
  border-bottom: 1px solid #e5e5e5;
}

.voucher-table tr:last-child td {
  border-bottom: none;
}

.voucher-table input[type="text"],
.voucher-table input[type="number"],
.voucher-table input[type="date"] {
  width: 100%;
  font-size: 0.8rem;
  padding: 0.15rem 0.3rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.3rem;
  background: #f9fafb;
  box-sizing: border-box;
}

.voucher-table input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
}



@media (max-width: 900px) {
  .voucher-table, .voucher-table th, .voucher-table td {
    font-size: 0.7rem;
    padding: 0.15rem 0.15rem;
  }
  .page-title {
    font-size: 1.1rem;
  }
}

</style>

<script lang="ts">
  import { supabase } from "$lib/supabaseClient";
  import type { PageData } from './$types';

  // Dashboard statistics
	let { data }: { data: PageData } = $props();

  // Loading states
  let error: string | null = null;

  // CSV Export states
  let isExporting = $state(false);
  let exportProgress = $state(0);

  // Quick navigation items
  const navigationItems = [
    {
      title: 'Vouchers',
      description: 'Add, edit, and manage vouchers',
      icon: '📄',
      href: '/vouchers',
      color: 'blue'
    },
    {
      title: 'Projects',
      description: 'Manage projects and assignments',
      icon: '📁',
      href: '/projects',
      color: 'green'
    },
    {
      title: 'Reports',
      description: 'View reports and generate PDFs',
      icon: '📊',
      href: '/reports',
      color: 'purple'
    },
    {
      title: 'Taxes',
      description: 'View summary of taxes and generate PDFs',
      icon: '💲',
      href: '/taxes',
      color: 'red'
    }
  ];

  // CSV Export Functions
  async function exportAllData() {
    try {
      isExporting = true;
      exportProgress = 0;
      error = null;

      // Step 1: Load all projects (20% progress)
      exportProgress = 20;
      const { data: allProjects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('code');

      if (projectsError) throw projectsError;

      // Step 2: Load all payees (40% progress)
      exportProgress = 40;
      const { data: allPayees, error: payeesError } = await supabase
        .from('payees')
        .select('*')
        .order('name');

      if (payeesError) throw payeesError;

      // Step 3: Load all vouchers with relationships (60% progress)
      exportProgress = 60;
      const { data: allVouchers, error: vouchersError } = await supabase
        .from('vouchers')
        .select(`
          *,
          payees(name, address, tin_id),
          projects(code, title, authorized_rep, approver)
        `)
        .order('date', { ascending: false });

      if (vouchersError) throw vouchersError;

      // Step 4: Generate CSV files (80% progress)
      exportProgress = 80;
      await generateCSVFiles({
        projects: allProjects || [],
        payees: allPayees || [],
        vouchers: allVouchers || []
      });

      // Step 5: Complete (100% progress)
      exportProgress = 100;
      
      // Reset after successful export
      setTimeout(() => {
        isExporting = false;
        exportProgress = 0;
      }, 1000);

    } catch (err) {
      console.error('Error exporting data:', err);
      error = 'Failed to export data. Please try again.';
      isExporting = false;
      exportProgress = 0;
    }
  }

  async function generateCSVFiles(data: {
    projects: any[];
    payees: any[];
    vouchers: any[];
  }) {
    const timestamp = new Date().toISOString().split('T')[0];

    // Generate Projects CSV
    const projectsCSV = generateProjectsCSV(data.projects);
    downloadCSV(projectsCSV, `projects_${timestamp}.csv`);

    // Generate Vouchers CSV
    const vouchersCSV = generateVouchersCSV(data.vouchers);
    downloadCSV(vouchersCSV, `vouchers_${timestamp}.csv`);
  }

  function generateProjectsCSV(projects: any[]): string {
    const headers = ['ID', 'Code', 'Title', 'Tax', 'Authorized Representative', 'Approver'];
    const rows = projects.map(project => [
      project.id,
      project.code,
      project.title,
      project.tax || '',
      project.authorized_rep || '',
      project.approver || ''
    ]);

    return convertToCSV([headers, ...rows]);
  }

  function generatePayeesCSV(payees: any[]): string {
    const headers = ['ID', 'Name', 'Address', 'TIN ID'];
    const rows = payees.map(payee => [
      payee.id,
      payee.name,
      payee.address || '',
      payee.tin_id || ''
    ]);

    return convertToCSV([headers, ...rows]);
  }

  function generateVouchersCSV(vouchers: any[]): string {
    const headers = [
      'ID', 'DV Number', 'Date', 'Gross Amount', 'Has Tax Deduction', 
      'Particulars', 'Payment Mode', 'Remarks',
      'Project Code', 'Project Title', 'Payee Name', 'Payee Address'
    ];
    
    const rows = vouchers.map(voucher => [
      voucher.id,
      voucher.dv_no,
      voucher.date,
      voucher.gross,
      voucher.has_tax_deduction ? 'Yes' : 'No',
      voucher.particulars || '',
      voucher.payment_mode || '',
      voucher.remarks || '',
      voucher.projects?.code || '',
      voucher.projects?.title || '',
      voucher.payees?.name || '',
      voucher.payees?.address || ''
    ]);

    return convertToCSV([headers, ...rows]);
  }

  function convertToCSV(data: any[][]): string {
    return data.map(row => 
      row.map((field: any) => {
        // Handle fields that might contain commas, quotes, or newlines
        const stringField = String(field || '');
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',')
    ).join('\n');
  }

  function downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  // Format date
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>Dashboard - Accounting System</title>
</svelte:head>

<div class="dashboard">
  <div class="page-header">
    <h1>Dashboard</h1>
    <p class="page-subtitle">Welcome to the NISMED Accounting System</p>
  </div>

    <!-- Statistics Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📁</div>
        <div class="stat-content">
          <h3>Total Projects</h3>
          <p class="stat-number">{data.totalProjects}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📄</div>
        <div class="stat-content">
          <h3>Total Vouchers</h3>
          <p class="stat-number">{data.totalVouchers}</p>
        </div>
      </div>

    </div>

    <!-- Quick Navigation -->
    <div class="section">
      <h2>Quick Navigation</h2>
      <div class="navigation-grid">
        {#each navigationItems as item}
          <a href={item.href} class="nav-card {item.color}">
            <div class="nav-icon">{item.icon}</div>
            <div class="nav-content">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
            <div class="nav-arrow">→</div>
          </a>
        {/each}
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="section">
      <h2>Recent Activity</h2>
      {#if data.recentActivity.length > 0}
        <div class="activity-list">
          {#each data.recentActivity as activity}
            <div class="activity-item">
              <div class="activity-icon">
                {#if activity.type === 'voucher'}📄{:else}📁{/if}
              </div>
              <div class="activity-content">
                <h4>{activity.title}</h4>
                <p class="activity-date">{formatDate(activity.date)}</p>
              </div>
              {#if activity.amount}
                <div class="activity-amount">
                  {formatCurrency(activity.amount)}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <div class="no-activity">
          <p>No recent activity found.</p>
        </div>
      {/if}
    </div>
    
    {#if data.role == 'admin'}
      <!-- Data Export -->
      <div class="section">
        <h2>Data Export</h2>
        <div class="export-section">
          <div class="export-info">
            <h3>Export Data to CSV</h3>
            <p>Download your projects and vouchers data in CSV format for backup or analysis.</p>
            
            <div class="export-details">
              <div class="export-item">
                <span class="export-icon">📁</span>
                <span>Projects data with codes and details</span>
              </div>
              <div class="export-item">
                <span class="export-icon"></span>
                <span>All vouchers with complete transaction history</span>
              </div>
            </div>
          </div>

          <div class="export-action">
            {#if isExporting}
              <div class="export-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: {exportProgress}%"></div>
                </div>
                <p class="progress-text">Exporting data... {exportProgress}%</p>
              </div>
            {:else}
              <button class="export-button" onclick={exportAllData}>
                📥 Export Data
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/if}
</div>

<style>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-header h1 {
  font-size: 3rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1.25rem;
  color: #6b7280;
  margin: 0;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 3rem;
  background: #f3f4f6;
  width: 80px;
  height: 80px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content h3 {
  font-size: 1rem;
  font-weight: 500;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.stat-small {
  font-size: 1.5rem;
}

/* Sections */
.section {
  margin-bottom: 3rem;
}

.section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

/* Navigation Grid */
.navigation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 1.5rem;
}

.nav-card {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  text-decoration: none;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.nav-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
}

.nav-card.blue:hover {
  border-color: #3b82f6;
}

.nav-card.green:hover {
  border-color: #10b981;
}

.nav-card.purple:hover {
  border-color: #8b5cf6;
}

.nav-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
}

.nav-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.nav-content p {
  color: #6b7280;
  margin: 0;
}

.nav-arrow {
  font-size: 1.5rem;
  color: #9ca3af;
  margin-left: auto;
  transition: transform 0.2s;
}

.nav-card:hover .nav-arrow {
  transform: translateX(4px);
}

/* Activity List */
.activity-list {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item:hover {
  background: #f9fafb;
}

.activity-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-content {
  flex: 1;
}

.activity-content h4 {
  font-size: 1rem;
  font-weight: 500;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.activity-date {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.activity-amount {
  font-size: 1rem;
  font-weight: 600;
  color: #059669;
}

.no-activity {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

/* Data Export Section */
.export-section {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2rem;
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  align-items: center;
}

.export-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.export-info p {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.export-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.export-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #374151;
  font-size: 0.875rem;
}

.export-icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
}

.export-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 200px;
}

.export-button {
  background: #059669;
  color: white;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.export-button:hover {
  background: #047857;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.export-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #059669, #10b981);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  color: #059669;
  font-weight: 600;
  font-size: 0.875rem;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .navigation-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 1.5rem;
  }

  .nav-card {
    padding: 1.5rem;
  }

  .export-section {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    text-align: center;
  }

  .export-action {
    min-width: auto;
  }

  .export-button {
    width: 100%;
    justify-content: center;
  }
}
</style>

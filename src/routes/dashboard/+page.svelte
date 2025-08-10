<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from "$lib/supabaseClient";

  // Dashboard statistics
  let totalProjects = 0;
  let totalVouchers = 0;
  let totalAmount = 0;
  let recentActivity: Array<{
    type: 'voucher' | 'project';
    title: string;
    date: string;
    amount?: number;
  }> = [];

  // Loading states
  let isLoading = true;
  let error: string | null = null;

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
    }
  ];

  // Load dashboard data
  async function loadDashboardData() {
    try {
      isLoading = true;
      error = null;

      // Load projects count
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*');

      if (projectsError) throw projectsError;
      totalProjects = projects?.length || 0;

      // Load vouchers data
      const { data: vouchers, error: vouchersError } = await supabase
        .from('vouchers')
        .select(`
          *,
          payees(name),
          projects(title, code)
        `)
        .order('date', { ascending: false });

      if (vouchersError) throw vouchersError;
      
      totalVouchers = vouchers?.length || 0;
      totalAmount = vouchers?.reduce((sum, voucher) => sum + (voucher.gross || 0), 0) || 0;

      // Create recent activity from recent vouchers
      recentActivity = (vouchers?.slice(0, 5) || []).map(voucher => ({
        type: 'voucher' as const,
        title: `${voucher.dv_no} - ${voucher.payees?.name}`,
        date: voucher.date,
        amount: voucher.gross
      }));

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      error = 'Failed to load dashboard data. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadDashboardData();
  });

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
    <p class="page-subtitle">Welcome to the Accounting System</p>
  </div>

  {#if error}
    <div class="error-message">
      <p>{error}</p>
      <button on:click={loadDashboardData} class="retry-button">
        🔄 Retry
      </button>
    </div>
  {:else if isLoading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading dashboard...</p>
    </div>
  {:else}
    <!-- Statistics Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📁</div>
        <div class="stat-content">
          <h3>Total Projects</h3>
          <p class="stat-number">{totalProjects}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📄</div>
        <div class="stat-content">
          <h3>Total Vouchers</h3>
          <p class="stat-number">{totalVouchers}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <h3>Total Amount</h3>
          <p class="stat-number">{formatCurrency(totalAmount)}</p>
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
      {#if recentActivity.length > 0}
        <div class="activity-list">
          {#each recentActivity as activity}
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

    <!-- Quick Actions -->
    <div class="section">
      <h2>Quick Actions</h2>
      <div class="actions-grid">
        <button class="action-button primary" on:click={() => window.location.href = '/vouchers'}>
          ➕ Add New Voucher
        </button>
        <button class="action-button secondary" on:click={() => window.location.href = '/projects'}>
          📁 Add New Project
        </button>
        <button class="action-button tertiary" on:click={() => window.location.href = '/reports'}>
          📊 Generate Reports
        </button>
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

/* Loading and Error States */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  padding: 2rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  margin-bottom: 2rem;
}

.retry-button {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 600;
  margin-top: 1rem;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background: #b91c1c;
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

/* Quick Actions */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-button {
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  font-size: 1rem;
}

.action-button.primary {
  background: #3b82f6;
  color: white;
}

.action-button.primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.action-button.secondary {
  background: #10b981;
  color: white;
}

.action-button.secondary:hover {
  background: #059669;
  transform: translateY(-1px);
}

.action-button.tertiary {
  background: #8b5cf6;
  color: white;
}

.action-button.tertiary:hover {
  background: #7c3aed;
  transform: translateY(-1px);
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

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 1.5rem;
  }

  .nav-card {
    padding: 1.5rem;
  }
}
</style>

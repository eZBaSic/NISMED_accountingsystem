<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    // Redirect to dashboard on load
    goto('/dashboard', { replaceState: true });
  });
</script>

<svelte:head>
  <title>Accounting System</title>
</svelte:head>

<!-- Loading state while redirecting -->
<div class="redirect-loading">
  <div class="spinner"></div>
  <p>Loading Accounting System...</p>
</div>

<style>
.redirect-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
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
</style>
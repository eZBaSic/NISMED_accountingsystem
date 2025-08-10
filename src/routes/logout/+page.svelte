<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { signOut } from '$lib/stores/auth';

  onMount(async () => {
    // Additional client-side logout to ensure clean state
    await signOut();
    
    // Redirect to login after a short delay to ensure logout is complete
    setTimeout(() => {
      goto('/login', { replaceState: true });
    }, 100);
  });
</script>

<svelte:head>
  <title>Logging out...</title>
</svelte:head>

<div class="flex items-center justify-center min-h-64">
  <div class="text-center">
    <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-green-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p class="mt-2 text-gray-600">Logging out...</p>
  </div>
</div>

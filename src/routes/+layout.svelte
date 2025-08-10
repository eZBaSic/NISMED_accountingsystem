<script lang="ts">
  import "../app.css"
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { initializeAuth, user, loading } from '$lib/stores/auth';

  // Get server-side data
  export let data;

  // Initialize auth on mount with server data
  onMount(() => {
    // Set initial user state from server data to prevent flashing
    if (data.user) {
      user.set(data.user);
      loading.set(false);
    }
    
    // Then initialize the client-side auth
    initializeAuth();
  });

  // Use server data initially, then client data once loaded
  $: currentUser = data.user || $user;
  $: isLoading = !data.user && $loading;
  $: showNavigation = !page.url.pathname.startsWith('/login') && currentUser;
</script>

{#if showNavigation}
<nav class={`px-5 py-3 w-full bg-green-700 text-white font-display shadow-md`}>
  <div class="w-full mx-auto">
    <div class="flex items-center justify-between h-16">
      <!-- Left: Logo and nav links -->
      <div class="flex items-center gap-5">
        <a href="/dashboard" class="flex items-center gap-2 ">
          <img src="/nismed.png" alt="NISMED Logo" class="h-13 w-13 rounded-md bg-white p-1 shadow" />
        </a>
        {#each [
          {href: "/dashboard", title: "Dashboard"},
          {href: "/vouchers", title: "Vouchers"},
          {href: "/projects", title: "Projects"},
          {href: "/reports", title: "Reports"}, 
        ] as {href, title}}
            <a href={href} class={`hover:text-green-200 ${`hover:bg-green-800`} px-5 py-3 transition-colors font-semibold rounded-full ${page.url.pathname.startsWith(href) ? `bg-green-800` : ''}`}>{title}</a>
        {/each}
      </div>
      <!-- Right: User email and Logout -->
      <div class="flex items-center gap-4">
        {#if currentUser}
          <span class="text-green-200 text-sm">
            {currentUser.email}
          </span>
        {/if}
        <a href="/logout" class="hover:bg-green-900 px-4 py-2 rounded font-semibold transition-colors">Logout</a>
      </div>
    </div>  
  </div>
</nav>
{/if}

<main class="font-display bg-white py-5 px-10">
  {#if isLoading}
    <div class="flex items-center justify-center min-h-64">
      <div class="text-center">
        <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-green-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  {:else}
    <slot />
  {/if}
</main>

<style>
  :global(html) {
    font-family: var(--font-display), Inter, sans-serif;
  }
</style>

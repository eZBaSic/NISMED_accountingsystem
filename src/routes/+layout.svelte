<script lang="ts">
  import "../app.css"
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
</script>

<nav class={`px-5 py-3 w-full bg-green-700 text-white font-display shadow-md`}>
  <div class="w-full mx-auto">
    <div class="flex items-center justify-between h-16">
      <!-- Left: Logo and nav links -->
      <div class="flex items-center gap-5">
        <a href="/" class="flex items-center gap-2 ">
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
      <!-- Right: Logout -->
      <div>
        <a href="/logout" class="hover:bg-green-900 px-4 py-2 rounded font-semibold transition-colors">Logout</a>
      </div>
    </div>  
  </div>
</nav>

<main class="font-display bg-white py-5 px-10">
  <slot />
</main>

<style>
  :global(html) {
    font-family: var(--font-display), Inter, sans-serif;
  }
</style>

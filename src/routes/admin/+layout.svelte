<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';

	let loading = true;
	let authorized = false;

	onMount(async () => {
		const {
			data: { user }
		} = await supabase.auth.getUser();

		if (!user) {
			goto('/login');
			return;
		}

		const { data: profile } = await supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

		if (profile?.role !== 'admin') {
			goto('/');
			return;
		}

		authorized = true;
		loading = false;
	});
</script>

{#if loading}
	<p>Loading...</p>
{:else if authorized}
	<slot />
{/if}
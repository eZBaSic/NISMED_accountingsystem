<script lang="ts">
	import type { PageData } from './$types';
	import RedAsterisk from '$lib/components/RedAsterisk.svelte';

	const props = $props<{
		data: PageData;
	}>();

	const summaries = props.data.summaries;
	const role = props.data.role;

	let show_add_modal = $state(false);
	let show_edit_modal = $state(false);
	let show_delete_modal = $state(false);

	let delete_project_id = $state<number | undefined>();
	let delete_project_title = $state('');

	let project_form = $state<project>({
		code: '',
		title: '',
		tax: 10,
		authorized_rep: '',
		approver: '',
		admin_officer: ''
	});

	let edit_form = $state<project>({
		id: undefined,
		code: '',
		title: '',
		tax: 0,
		authorized_rep: '',
		approver: '',
		admin_officer: ''
	});

	function open_add_modal() {
		show_add_modal = true;
	}

	function close_add_modal() {
		show_add_modal = false;
	}

	function open_edit_modal(s: summary) {
		edit_form = {
			id: s.project_id,
			code: s.code,
			title: s.title,
			tax: s.tax,
			authorized_rep: s.authorized_rep,
			approver: s.approver,
			admin_officer: s.admin_officer
		};

		show_edit_modal = true;
	}

	function close_edit_modal() {
		show_edit_modal = false;
	}

	function open_delete_modal(s: summary) {
		delete_project_id = s.project_id;
		delete_project_title = s.title;
		show_delete_modal = true;
	}

	function close_delete_modal() {
		show_delete_modal = false;
	}
</script>



<div class="page-header">
  <h1 class="page-title">Projects</h1>
  <span class="text-gray-600/70">|</span>
  <button class="add-project-btn" onclick={open_add_modal}>
    + Add Project
  </button>
</div>

{#if show_add_modal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop" onclick={close_add_modal}></div>
  <div class="modal">
    <h2 class="modal-title">Add New Project</h2>
    <form method="POST" action="?/createProject">
      <label>Code<RedAsterisk />
        <input name="code" type="text" bind:value={project_form.code} required />
      </label>
      <label>Title<RedAsterisk />
        <input name="title" type="text" bind:value={project_form.title} required />
      </label>
      <label>Tax (%)<RedAsterisk />
        <input name="tax" type="number" bind:value={project_form.tax} min="0" step="1" required />
      </label>
      <label>Authorized Rep<RedAsterisk />
        <input name="authorized_rep" type="text" bind:value={project_form.authorized_rep} required />
      </label>
      <label>Approver<RedAsterisk />
        <input name="approver" type="text" bind:value={project_form.approver} required />
      </label>
      <label>Admin Officer
        <input name="admin_officer" type="text" bind:value={project_form.admin_officer} />
      </label>
      <div class="modal-actions">
        <button type="button" class="modal-cancel" onclick={close_add_modal}>Cancel</button>
        <button type="submit" class="modal-submit">Create</button>
      </div>
    </form>
  </div>
{/if}

{#if show_edit_modal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop" onclick={close_edit_modal}></div>
  <div class="modal">
    <h2 class="modal-title">Edit Project</h2>
    <form method="POST" action="?/updateProject">
      <input type="hidden" name="id" value={edit_form.id}/>
      <label>Code
        <input name="code" type="text" bind:value={edit_form.code} required />
      </label>
      <label>Title
        <input name="title" type="text" bind:value={edit_form.title} required />
      </label>
      <label>Tax (%)
        <input name="tax" type="number" bind:value={edit_form.tax} min="0" step="0.01" required />
      </label>
      <label>Authorized Rep
        <input name="authorized_rep" type="text" bind:value={edit_form.authorized_rep} required />
      </label>
      <label>Approver
        <input name="approver" type="text" bind:value={edit_form.approver} required />
      </label>
      <label>Admin Officer
        <input name="admin_officer" type="text" bind:value={edit_form.admin_officer} required />
      </label>
      <div class="modal-actions">
        <button type="button" class="modal-cancel" onclick={close_edit_modal}>Cancel</button>
        <button type="submit" class="modal-submit">Save</button>
      </div>
    </form>
  </div>
{/if}

<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if show_delete_modal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="modal-backdrop" onclick={close_delete_modal}></div>
  <div class="modal">
    <h2 class="modal-title">Delete Project</h2>
    <p>Are you sure you want to delete the project <b>{delete_project_title}</b>? This action cannot be undone.</p>
    <div class="modal-actions">
      <button type="button" class="modal-cancel" onclick={close_delete_modal}>Cancel</button>
      <form method="POST" action="?/deleteProject">
        <input type="hidden" name="id" value={delete_project_id}/>

        <button type="submit" class="modal-submit">
          Delete
        </button>
      </form>
    </div>
  </div>
{/if}

<table class="summary-table border-2 border-green-800">
  <thead>
    <tr>
      <th>Code</th>
      <th>Title</th>
      <th>Tax</th>
      <th>Authorized Rep.</th>
      <th>Approver</th>
      <th>Admin Officer</th>
      <th>Total Vouchers</th>
      <th>Gross Total</th>
      <th>Net Total</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each summaries as s}
      <tr>
        <td>{s.code}</td>
        <td>{s.title}</td>
        <td>{s.tax}%</td>
        <td>{s.authorized_rep}</td>
        <td>{s.approver}</td>
        <td>{s.admin_officer}</td>
        <td>{s.total_vouchers}</td>
        <td>{s.gross_total}</td>
        <td>{s.net_total}</td>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <td class="space-x-3">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span class="text-blue-500 hover:underline cursor-pointer" onclick={() => open_edit_modal(s)}>Edit</span>
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <span class="text-red-500 hover:underline cursor-pointer" onclick={() => open_delete_modal(s)}>Delete</span>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

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

.add-project-btn {
  background: oklch(44.8% 0.119 151.328);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.15s;
  box-shadow: 0 2px 8px 0 rgba(44, 62, 80, 0.04);
}
.add-project-btn:hover,
.add-project-btn:focus {
  background: oklch(34.389% 0.09873 148.331);
  outline: none;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0;
}
.summary-table th {
  background: oklch(44.8% 0.119 151.328); /* dark green */
  color: #fff;
  padding: 0.75rem 1rem;
  text-align: left;
}
.summary-table td {
  background: #fff;
  color: #111;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e5e5;
}
.summary-table tr:last-child td {
  border-bottom: none;
}

.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  z-index: 40;
}
.modal {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  padding: 2rem 2.5rem;
  border-radius: 1rem;
  box-shadow: 0 8px 32px 0 rgba(44, 62, 80, 0.18);
  z-index: 50;
  min-width: 320px;
  max-width: 95vw;
}
.modal-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 1.2rem;
  color: oklch(44.8% 0.119 151.328);
}
.modal label {
  display: block;
  margin-bottom: 0.7rem;
  font-weight: 500;
  color: #222;
}
.modal input[type="text"], .modal input[type="number"] {
  width: 100%;
  padding: 0.5rem 0.7rem;
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.4rem;
  font-size: 1rem;
  background: #f9fafb;
  transition: border 0.15s;
}
.modal input:focus {
  border: 1.5px solid oklch(44.8% 0.119 151.328);
  outline: none;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 1.2rem;
}
.modal-cancel {
  background: #e5e7eb;
  color: #222;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 0.4rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.modal-cancel:hover {
  background: #d1d5db;
}
.modal-submit {
  background: oklch(44.8% 0.119 151.328);
  color: #fff;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 0.4rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.modal-submit:hover {
  background: oklch(34.389% 0.09873 148.331);
}
</style>
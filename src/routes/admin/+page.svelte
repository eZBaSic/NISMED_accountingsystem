<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let editModalOpen = $state(false);

	let selectedUser = $state<{
		id: string;
		email: string;
		role: string;
		first_name: string;
		last_name: string;
		projectIds: number[];
	} | null>(null);

	// convert DB rows → fast lookup
	function getUserProjectIds(userId: string) {
		if (data.userProjects) {
			return data.userProjects
			.filter((up: any) => up.user_id === userId)
			.map((up: any) => up.project_id);
		}
	}

	function openEdit(user: any) {
		selectedUser = {
			id: user.id,
			email: user.email,
			role: user.role,
			first_name: user.first_name,
			last_name: user.last_name,
			projectIds: getUserProjectIds(user.id) ?? []
		};

		selectedUser.projectIds = getUserProjectIds(user.id) ?? [];

		editModalOpen = true;
	}

	function closeEdit() {
		editModalOpen = false;
		selectedUser = null;
	}

	async function deleteUser(id: string) {
		const confirmed = confirm(
			'Are you sure you want to delete this user?'
		);

		if (!confirmed) return;

		const formData = new FormData();
		formData.append('userId', id);

		await fetch('?/deleteUser', {
			method: 'POST',
			body: formData
		});

		await invalidateAll();
	}

</script>

<div class="page-container">
	<div class="page-header">
		<div>
			<h1>User Management</h1>
			<p>Manage system users and permissions.</p>
		</div>

		<a
			href="/admin/create"
			class="create-btn"
		>
			+ Create User
		</a>
	</div>

	<div class="user-list">
		{#each data.users as user}
			<div class="user-row">
				<div class="user-info">
					<div class="email">
						{user.email}
					</div>

					<div class="role">
						{user.role}
					</div>
				</div>

				<div class="actions">
					<button
						class="edit-btn"
						onclick={() => openEdit(user)}
					>
						Edit
					</button>

					<button
						class="delete-btn"
						onclick={() => deleteUser(user.id)}
					>
						Delete
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>

{#if editModalOpen && selectedUser}
	<div class="modal-backdrop">
		<div class="modal">
			<div class="modal-header">
				<h2>Edit User</h2>

				<button onclick={closeEdit}>
					✕
				</button>
			</div>

			<form
				method="POST"
				action="?/updateUser"
			>
				<input
					type="hidden"
					name="userId"
					value={selectedUser.id}
				/>

				<div class="form-group">
					<label for="first_name">First Name</label>

					<input
						name="first_name"
						bind:value={selectedUser.first_name}
						required
					/>
				</div>

				<div class="form-group">
					<label for="last_name">Last Name</label>

					<input
						name="last_name"
						bind:value={selectedUser.last_name}
						required
					/>
				</div>

				<div class="form-group">
					<label for="email">Email</label>

					<input
						name="email"
						bind:value={selectedUser.email}
					/>
				</div>

				<div class="form-group">
					<label for="role">Role</label>

					<select
						name="role"
						bind:value={selectedUser.role}
					>
						<option value="user">
							User
						</option>

						<option value="admin">
							Admin
						</option>
					</select>
				</div>

				<div class="form-group">
					<label for="project-list">
						Assigned Projects
					</label>

					<div class="project-list">
						{#each data.projects as project}
							<label class="project-item">
								<input
									type="checkbox"
									name="projectIds"
									value={project.id}
									checked={selectedUser.projectIds.includes(project.id)}
								/>
								{project.code}
								-
								{project.title}
							</label>
						{/each}
					</div>
				</div>

				<div class="modal-actions">
					<button
						type="submit"
						class="save-btn"
					>
						Save Changes
					</button>
				</div>
			</form>

			<hr />

			<form
				method="POST"
				action="?/resetPassword"
			>
				<input
					type="hidden"
					name="userId"
					value={selectedUser.id}
				/>

				<button
					type="submit"
					class="secondary-btn"
				>
					Send Password Reset
				</button>
			</form>

			<form
				method="POST"
				action="?/deleteUser"
			>
				<input
					type="hidden"
					name="userId"
					value={selectedUser.id}
				/>

				<button
					type="submit"
					class="danger-btn"
				>
					Delete User
				</button>
			</form>
		</div>
	</div>
{/if}

<style>
	.page-container {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.page-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.page-header h1 {
	margin: 0;
}

.page-header p {
	margin-top: 0.25rem;
	color: #6b7280;
}

.create-btn {
	text-decoration: none;
	background: #2563eb;
	color: white;
	padding: 0.75rem 1rem;
	border-radius: 8px;
	font-weight: 500;
}

.user-list {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.user-row {
	display: flex;
	justify-content: space-between;
	align-items: center;

	padding: 1rem;

	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 10px;
}

.user-info {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.email {
	font-weight: 500;
}

.role {
	font-size: 0.875rem;
	color: #6b7280;
	text-transform: capitalize;
}

.actions {
	display: flex;
	gap: 0.75rem;
}

.edit-btn {
	text-decoration: none;
	padding: 0.5rem 0.75rem;

	border: 1px solid #d1d5db;
	border-radius: 8px;

	color: #111827;
}

.delete-btn {
	border: none;
	padding: 0.5rem 0.75rem;

	border-radius: 8px;

	background: #dc2626;
	color: white;

	cursor: pointer;
}


.modal-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.6); /* slate-900-ish */
	backdrop-filter: blur(4px);

	display: flex;
	align-items: center;
	justify-content: center;

	z-index: 1000;
	padding: 1rem;
}

/* MAIN MODAL */
.modal {
	width: min(720px, 95vw);
	max-height: 90vh;

	background: #ffffff;
	border-radius: 16px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);

	display: flex;
	flex-direction: column;
	overflow: hidden;
}

/* HEADER */
.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;

	padding: 1.25rem 1.5rem;
	border-bottom: 1px solid #e5e7eb;

	background: #fafafa;
	position: sticky;
	top: 0;
}

.modal-header h2 {
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: #111827;
}

.modal-header button {
	border: none;
	background: transparent;
	font-size: 1.25rem;
	cursor: pointer;
	color: #6b7280;
	padding: 0.25rem 0.5rem;
	border-radius: 8px;
}

.modal-header button:hover {
	background: #f3f4f6;
	color: #111827;
}

/* FORM */
form {
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
}

.form-group label {
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
}

.form-group input,
.form-group select {
	padding: 0.75rem 0.9rem;
	border: 1px solid #d1d5db;
	border-radius: 10px;
	font-size: 0.95rem;
	background: white;
	transition: 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
	outline: none;
	border-color: #2563eb;
	box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

/* PROJECT LIST */
.project-list {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;

	max-height: 180px;
	overflow-y: auto;

	padding: 0.75rem;
	border: 1px solid #e5e7eb;
	border-radius: 10px;
	background: #fafafa;
}

.project-item {
	display: flex;
	align-items: center;
	gap: 0.6rem;

	padding: 0.4rem 0.25rem;
	border-radius: 6px;

	font-size: 0.9rem;
	color: #374151;
	cursor: pointer;
}

.project-item:hover {
	background: #f3f4f6;
}

/* ACTION BUTTONS */
.modal-actions {
	display: flex;
	justify-content: flex-end;
	margin-top: 0.5rem;
}

.save-btn {
	background: #2563eb;
	color: white;

	border: none;
	padding: 0.75rem 1.1rem;
	border-radius: 10px;

	font-weight: 600;
	cursor: pointer;
	transition: 0.2s;
}

.save-btn:hover {
	background: #1d4ed8;
}

/* DIVIDERS */
hr {
	border: none;
	border-top: 1px solid #e5e7eb;
	margin: 0;
}

/* SECONDARY ACTION */
.secondary-btn {
	margin: 1rem 1.5rem 0;
	padding: 0.75rem 1rem;

	border-radius: 10px;
	border: 1px solid #d1d5db;

	background: white;
	cursor: pointer;

	font-weight: 500;
	color: #374151;
}

.secondary-btn:hover {
	background: #f9fafb;
}

/* DANGER SECTION */
.danger-btn {
	margin: 1rem 1.5rem 1.5rem;
	padding: 0.75rem 1rem;

	border-radius: 10px;
	border: none;

	background: #ef4444;
	color: white;

	font-weight: 600;
	cursor: pointer;
}

.danger-btn:hover {
	background: #dc2626;
}

</style>


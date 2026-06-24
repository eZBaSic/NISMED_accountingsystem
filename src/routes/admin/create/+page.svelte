<div class="admin-card">
	<div class="card-header">
		<h2>Create User</h2>
		<p>Add a new user account and assign a role.</p>
	</div>

	<form method="POST" class="user-form">
	<div class="form-group">
		<label for="first_name">First Name</label>
		<input
			id="first_name"
			type="text"
			name="first_name"
			placeholder="Juan"
			required
		/>
	</div>

	<div class="form-group">
		<label for="last_name">Last Name</label>
		<input
			id="last_name"
			type="text"
			name="last_name"
			placeholder="Dela Cruz"
			required
		/>
	</div>
		<div class="form-group">
			<label for="email">Email</label>
			<input
				id="email"
				type="email"
				name="email"
				placeholder="user@example.com"
				required
			/>
		</div>

		<div class="form-group">
			<label for="password">Password</label>
			<input
				id="password"
				type="password"
				name="password"
				placeholder="Minimum 8 characters"
				required
				minlength="8"
			/>
		</div>

		<div class="form-group">
			<label for="role">Role</label>

			<select id="role" name="role">
				<option value="user">User</option>
				<option value="admin">Admin</option>
			</select>
		</div>

		<div class="form-actions">
			<button type="submit" class="primary-btn">
				Create User
			</button>
		</div>
	</form>
</div>

<style>
	.admin-card {
	max-width: 600px;
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 12px;
	padding: 1.5rem;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	width: 50%;
    margin-inline: auto;
}

.card-header {
	margin-bottom: 1.5rem;
}

.card-header h2 {
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
}

.card-header p {
	margin-top: 0.5rem;
	color: #6b7280;
	font-size: 0.9rem;
}

.user-form {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.form-group label {
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
}

.form-group input,
.form-group select {
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 8px;
	font-size: 0.95rem;
	box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
	outline: none;
	border-color: #2563eb;
	box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-actions {
	display: flex;
	justify-content: flex-end;
	margin-top: 0.5rem;
}

.primary-btn {
	padding: 0.75rem 1.25rem;
	border: none;
	border-radius: 8px;
	background: #2563eb;
	color: white;
	font-weight: 500;
	cursor: pointer;
	transition: 0.2s;
}

.primary-btn:hover {
	background: #1d4ed8;
}
</style>


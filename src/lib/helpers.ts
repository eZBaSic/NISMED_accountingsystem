import { supabase } from "$lib/supabaseClient";

export function show(thing: any) {
  alert(JSON.stringify(thing, null, 2))
}

export async function getUserAccess() {
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) return null;

	const { data: profile } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single();

	const { data: userProjects } = await supabase
		.from('user_projects')
		.select('project_id')
		.eq('user_id', user.id);

	return {
		user,
		role: profile?.role ?? 'user',
		projectIds:
			userProjects?.map((p) => p.project_id) ?? []
	};
}
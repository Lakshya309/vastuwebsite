// app/admin/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { redirect } from 'next/navigation';
import AdminUserTable from './AdminUserTable';
import AstrologerKeyGenerator from './AstrologerKeyGenerator';
import AdminProjectTable from './AdminProjectTable';

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();


  const { data: { user } } = await supabase.auth.getUser();


  if (!user) {
    redirect('/login');
  }

  // Double check role on server-side rendering
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    redirect('/portal');
  }

  // Fetch all profiles and their credits
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, valid_from, valid_to');

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    return <div>Error loading profiles.</div>;
  }

  // Fetch all projects and their owners' emails
  const { data: allProjects, error: projectsError } = await supabaseAdmin
    .from('projects')
    .select(`
      id,
      name,
      created_at,
      user_id,
      profiles (
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (projectsError) {
    console.error("Error fetching all projects:", projectsError);
    return <div>Error loading projects.</div>;
  }

  const { data: userCredits, error: creditsError } = await supabaseAdmin
    .from('user_credits')
    .select('user_id, credits');


  if (creditsError) {
    console.error("Error fetching user credits:", creditsError);
    return <div>Error loading user credits.</div>;
  }

  // Combine profiles and credits
  const usersWithCredits = profiles.map(profile => {
    const credits = userCredits.find(credit => credit.user_id === profile.id);
    return {
      ...profile,
      credits: credits ? credits.credits : 0,
    };
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <AstrologerKeyGenerator />
      <AdminUserTable users={usersWithCredits} />
      <AdminProjectTable projects={allProjects} />
    </div>
  );
}

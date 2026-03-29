// app/admin/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase';
import { prisma } from '@/lib/db';
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
  const profile = await prisma.profiles.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (!profile || profile.role !== 'admin') {
    redirect('/portal');
  }

  try {
    // Fetch all profiles and their credits
    const profiles = await prisma.profiles.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        valid_from: true,
        valid_to: true,
      }
    });

    // Fetch all projects and their owners' emails
    const allProjects = await prisma.projects.findMany({
      select: {
        id: true,
        name: true,
        created_at: true,
        user_id: true,
        profiles: {
          select: { email: true }
        }
      },
      orderBy: { created_at: 'desc' },
      where: { deleted_at: null }
    });

    const userCredits = await prisma.user_credits.findMany({
      select: { user_id: true, credits: true }
    });

    // Combine profiles and credits
    const usersWithCredits = profiles.map(p => {
      // Create a plain object that doesn't conflict with serialization later if needed
      const plainProfile = { ...p, valid_from: p.valid_from?.toISOString() || null, valid_to: p.valid_to?.toISOString() || null };
      const creditsRecord = userCredits.find(credit => credit.user_id === p.id);
      return {
        ...plainProfile,
        credits: creditsRecord ? creditsRecord.credits : 0,
      };
    });

    // Transform projects data to match component props (making it serialized)
    const transformedProjects = allProjects.map(project => {
      const p = {
        ...project,
        created_at: project.created_at?.toISOString() || null,
        profiles: project.profiles || null,
      };
      return p;
    });

    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <AstrologerKeyGenerator />
        <AdminUserTable users={usersWithCredits as any} />
        <AdminProjectTable projects={transformedProjects as any} />
      </div>
    );
  } catch (error) {
    console.error("Error loading admin data:", error);
    return <div>Error loading admin data. Ensure the database connection is valid.</div>;
  }
}

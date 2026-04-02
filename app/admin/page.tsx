// app/admin/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import AdminUserTable from './AdminUserTable';
import AdminProjectTable from './AdminProjectTable';
import AdminApplicationTable from './AdminApplicationTable';

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
      <div className="min-h-screen pt-32 px-6 lg:px-24 pb-40 relative overflow-hidden">
        
        {/* BACKGROUND ELEMENTS */}
        <div className="fixed inset-0 z-0 pointer-events-none organic-gradient opacity-60" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="mb-20">
            <h1 className="text-5xl md:text-8xl font-cormorant font-bold italic text-primary leading-tight">Command Center.</h1>
            <p className="text-gray-500 mt-4 flex items-center gap-2 font-light tracking-widest uppercase text-[10px]">
              Global Platform Governance & Astral Oversight
            </p>
          </div>

          <div className="grid gap-16">
            <section>
               <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-8 px-4">Practitioner Applications</h2>
               <div className="glass rounded-[2rem] overflow-hidden border border-white">
                 <AdminApplicationTable />
               </div>
            </section>

            <section>
               <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-8 px-4">User Constellation</h2>
               <div className="glass rounded-[2rem] overflow-hidden border border-white">
                 <AdminUserTable users={usersWithCredits as any} />
               </div>
            </section>

            <section>
               <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-8 px-4">Project Streams</h2>
               <div className="glass rounded-[2rem] overflow-hidden border border-white">
                 <AdminProjectTable projects={transformedProjects as any} />
               </div>
            </section>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading admin data:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass p-12 text-center rounded-[3rem] border-red-100 bg-red-50/10">
          <p className="text-red-600 font-medium italic">Spectral Sync Error: Ensure the database frequency is stable.</p>
        </div>
      </div>
    );
  }
}


// app/admin/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import AdminUserTable from './AdminUserTable';
import AdminProjectTable from './AdminProjectTable';
import AdminApplicationTable from './AdminApplicationTable';

async function fetchAdminData() {
  const profiles = await prisma.profiles.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      valid_from: true,
      valid_to: true,
    }
  });

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

  const usersWithCredits = profiles.map(p => {
    const plainProfile = { ...p, valid_from: p.valid_from?.toISOString() || null, valid_to: p.valid_to?.toISOString() || null };
    const creditsRecord = userCredits.find(credit => credit.user_id === p.id);
    return {
      ...plainProfile,
      credits: creditsRecord ? creditsRecord.credits : 0,
    };
  });

  const transformedProjects = allProjects.map(project => {
    const p = {
      ...project,
      created_at: project.created_at?.toISOString() || null,
      profiles: project.profiles || null,
    };
    return p;
  });

  return { usersWithCredits, transformedProjects };
}

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await prisma.profiles.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (!profile || profile.role !== 'admin') {
    redirect('/portal');
  }

  let usersWithCredits: any[] = [];
  let transformedProjects: any[] = [];

  try {
    const data = await fetchAdminData();
    usersWithCredits = data.usersWithCredits;
    transformedProjects = data.transformedProjects;
  } catch (error) {
    console.error("Error loading admin data:", error);
  }

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
}


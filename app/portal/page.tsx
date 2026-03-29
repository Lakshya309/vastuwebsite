// app/portal/page.tsx
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { prisma } from '../../lib/db';

async function getUserData(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  try {
    const profilePromise = prisma.profiles.findUnique({
      where: { id: user.id }
    });

    const projectsPromise = prisma.projects.findMany({
      where: { user_id: user.id, deleted_at: null },
      select: { id: true, name: true, created_at: true },
      orderBy: { created_at: 'desc' }
    });
      
    const creditsPromise = prisma.user_credits.findUnique({
      where: { user_id: user.id },
      select: { credits: true }
    });

    const [profile, projects, creditsData] = await Promise.all([profilePromise, projectsPromise, creditsPromise]);

    return { 
      user, 
      profile, 
      projects: projects || [],
      credits: creditsData?.credits ?? 0 
    };
  } catch (err) {
    console.error('Error fetching portal data:', err);
    return { user, profile: null, projects: [], credits: 0 };
  }
}

export default async function PortalPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { user, profile, projects, credits } = await getUserData(supabase);

  const isAstrologer = profile?.role === 'astrologer';
  const validityDate = profile?.valid_to ? new Date(profile.valid_to) : null;
  const isAstrologerAccessActive = isAstrologer && validityDate && validityDate > new Date();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold">User Portal</h1>
            <p className="text-gray-600 mt-1">Welcome, {user.email}</p>
          </div>
          <Link href="/api/auth/signout" className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded">
            Logout
          </Link>
        </header>

        {/* Status Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-xl font-semibold mb-3">Your Status</h2>
            {isAstrologerAccessActive ? (
              <div>
                <p className="text-lg text-green-600 font-semibold">Astrologer Access Active</p>
                <p className="text-gray-600">
                  Unlimited analysis until: {format(validityDate!, 'PPP')}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg text-blue-600 font-semibold">{credits} Credits Remaining</p>
                <p className="text-gray-600">
                  Used for generating Vastu reports.
                </p>
              </div>
            )}
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col justify-center">
            <h2 className="text-xl font-semibold mb-3">Have an Astrologer Key?</h2>
            <p className="text-gray-600 mb-4">Activate your key to unlock unlimited analysis for a set duration.</p>
            <Link href="/activate">
              <span className="inline-block w-full text-center px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700">
                Activate a Key
              </span>
            </Link>
          </div>
        </div>

        {/* Projects Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Your Projects</h2>
            <Link href="/projects/new">
                <span className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700">
                    + New Project
                </span>
            </Link>
          </div>
          <div className="space-y-4">
            {projects.length > 0 ? (
              projects.map((project: { id: string; name: string; created_at: Date | null }) => (
                <Link key={project.id} href={`/projects/${project.id}/floor-plan`}>
                  <div className="block p-4 bg-gray-50 rounded-lg shadow-sm hover:bg-gray-100 hover:shadow-md transition-all">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">{project.name}</h3>
                            <p className="text-sm text-gray-600">
                                Created: {project.created_at ? format(new Date(project.created_at), 'PPP') : 'Unknown'}
                            </p>
                        </div>
                        <span className="text-indigo-600 font-semibold">→</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
                <p className="text-gray-500">You haven't created any projects yet.</p>
                <Link href="/projects/new">
                    <span className="mt-4 inline-block px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700">
                        Create Your First Project
                    </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

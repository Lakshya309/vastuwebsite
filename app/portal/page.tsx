import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { prisma } from '../../lib/db';

async function getUserData() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || !user.id) {
    redirect('/login');
  }

  try {
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id }
    });

    const projects = await prisma.projects.findMany({
      where: { user_id: user.id, deleted_at: null },
      select: { id: true, name: true, created_at: true },
      orderBy: { created_at: 'desc' }
    });

    const creditsData = await prisma.user_credits.findUnique({
      where: { user_id: user.id },
      select: { credits: true }
    });

    const subscription = await prisma.user_subscriptions.findFirst({
      where: {
        user_id: user.id,
        status: { in: ['active', 'trialing'] },
        expires_at: { gt: new Date() },
      },
      include: { plans: true },
    });

    return {
      user,
      profile,
      projects: projects || [],
      credits: creditsData?.credits ?? 0,
      subscription,
    };
  } catch (err) {
    console.error('Error fetching portal data:', err);
    return { user, profile: null, projects: [], credits: 0, subscription: null };
  }
}

export default async function PortalPage() {
  const { user, profile, projects, credits, subscription } = await getUserData();

  const isAstrologer = profile?.role === 'astrologer';
  const validityDate = profile?.valid_to ? new Date(profile.valid_to) : null;
  const now = new Date();
  const isAstrologerAccessActive =
    isAstrologer &&
    profile?.valid_from &&
    profile?.valid_to &&
    now >= new Date(profile.valid_from) &&
    now <= new Date(profile.valid_to);

  const hasActiveSubscription = !!subscription || isAstrologerAccessActive;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold">User Portal</h1>
            <p className="text-gray-600 mt-1">Welcome, {user.email}</p>
          </div>
          <div className="flex gap-4">
            <Link href="/pricing" className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded">
              View Plans
            </Link>
            <Link href="/api/auth/signout" className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded">
              Logout
            </Link>
          </div>
        </header>

        {/* Status Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-xl font-semibold mb-3">Your Status</h2>
            {hasActiveSubscription ? (
              <div>
                <p className="text-lg text-green-600 font-semibold">
                  {isAstrologerAccessActive ? 'Astrologer' : 'Subscription'} Access Active
                </p>
                <p className="text-gray-600">
                  {subscription
                    ? `Valid until: ${format(new Date(subscription.expires_at), 'PPP')}`
                    : `Unlimited analysis until: ${format(validityDate!, 'PPP')}`
                  }
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

          {!hasActiveSubscription && (
            <>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-sm text-white">
                <h2 className="text-xl font-semibold mb-2">Need More Access?</h2>
                <p className="text-white/80 text-sm mb-4">Purchase credits or subscribe for unlimited access.</p>
                <Link href="/pricing">
                  <span className="inline-block w-full text-center px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50">
                    View Plans
                  </span>
                </Link>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col justify-center">
                <h2 className="text-xl font-semibold mb-3">Have an Astrologer Key?</h2>
                <p className="text-gray-600 mb-4">Activate your key to unlock unlimited analysis.</p>
                <Link href="/activate">
                  <span className="inline-block w-full text-center px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700">
                    Activate a Key
                  </span>
                </Link>
              </div>
            </>
          )}
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

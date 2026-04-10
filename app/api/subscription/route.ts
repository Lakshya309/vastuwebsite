import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAuth } from '@/lib/supabase-server-api';

export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;

    const subscription = await prisma.user_subscriptions.findFirst({
      where: {
        user_id: userId,
        status: { in: ['active', 'trialing'] },
      },
      include: {
        plans: true,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    const isActive = new Date(subscription.expires_at) > new Date();

    return NextResponse.json({
      subscription: {
        ...subscription,
        is_active: isActive,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

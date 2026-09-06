import { prisma } from '../lib/db';

async function main() {
  console.log('Starting seed...');

  const plans = [
    {
      name: 'Free Tier',
      description: '1-time full Vastu analysis • Manual Plot Entry Only • 5 Relocations Limit',
      price_inr: 0,
      duration_days: 365,
      plan_type: 'free',
      is_active: true,
      features: {
        key: 'free',
        relocations_limit: 5,
        map_upload_allowed: false,
        credits: 0,
        popular: false,
        badge: 'FREE',
        gst_rate: 0,
      },
    },
    {
      name: 'Basic Plan',
      description: '1 Project Credit • 5 Relocations Limit • Manual Plot & Map Upload',
      price_inr: 999,
      duration_days: 365,
      plan_type: 'credit',
      is_active: true,
      features: {
        key: 'basic',
        relocations_limit: 5,
        map_upload_allowed: true,
        credits: 1,
        popular: false,
        badge: 'BASIC',
        gst_rate: 18,
      },
    },
    {
      name: 'Advanced Plan',
      description: '1 Advanced Credit • 5 Relocations Limit • 45 Devta Grid & Shakti Chakra • Full PDF Report',
      price_inr: 2500,
      duration_days: 365,
      plan_type: 'credit',
      is_active: true,
      features: {
        key: 'advanced',
        relocations_limit: 5,
        map_upload_allowed: true,
        credits: 1,
        popular: true,
        badge: 'RECOMMENDED',
        gst_rate: 18,
      },
    },
    {
      name: 'Astrologer Monthly Expert',
      description: 'Unlimited Vastu analysis for astrologers & consultants for 30 days',
      price_inr: 1999,
      duration_days: 30,
      plan_type: 'subscription',
      is_active: true,
      features: {
        key: 'astrologer_monthly',
        relocations_limit: -1,
        map_upload_allowed: true,
        credits: -1,
        popular: false,
        badge: 'EXPERT',
        gst_rate: 18,
      },
    },
    {
      name: 'Astrologer Quarterly Expert',
      description: 'Unlimited Vastu analysis for astrologers & consultants for 90 days',
      price_inr: 5499,
      duration_days: 90,
      plan_type: 'subscription',
      is_active: true,
      features: {
        key: 'astrologer_quarterly',
        relocations_limit: -1,
        map_upload_allowed: true,
        credits: -1,
        popular: false,
        badge: 'EXPERT',
        gst_rate: 18,
      },
    },
    {
      name: 'Astrologer Yearly Expert',
      description: 'Unlimited Vastu analysis for astrologers & consultants for 365 days',
      price_inr: 19999,
      duration_days: 365,
      plan_type: 'subscription',
      is_active: true,
      features: {
        key: 'astrologer_yearly',
        relocations_limit: -1,
        map_upload_allowed: true,
        credits: -1,
        popular: false,
        badge: 'EXPERT',
        gst_rate: 18,
      },
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.subscription_plans.findFirst({
      where: { name: plan.name },
    });

    if (!existing) {
      await prisma.subscription_plans.create({
        data: plan,
      });
      console.log(`Created plan: ${plan.name}`);
    } else {
      await prisma.subscription_plans.update({
        where: { id: existing.id },
        data: plan,
      });
      console.log(`Updated plan: ${plan.name}`);
    }
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

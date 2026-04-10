import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const plans = [
    {
      name: 'Monthly Expert',
      description: 'Unlimited Vastu analysis for one month',
      price_inr: 999,
      duration_days: 30,
      plan_type: 'monthly',
      is_active: true,
    },
    {
      name: 'Quarterly Expert',
      description: 'Unlimited Vastu analysis for three months',
      price_inr: 2499,
      duration_days: 90,
      plan_type: 'quarterly',
      is_active: true,
    },
    {
      name: 'Yearly Expert',
      description: 'Unlimited Vastu analysis for one year',
      price_inr: 7999,
      duration_days: 365,
      plan_type: 'yearly',
      is_active: true,
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
      console.log(`Plan already exists: ${plan.name}`);
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

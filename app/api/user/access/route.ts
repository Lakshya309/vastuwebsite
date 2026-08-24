import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import {
  PLAN_LIMITS,
  FREE_TIER_OBJECTS,
  BASIC_TIER_OBJECTS,
  type PlanTier,
} from "@/lib/planConfig";

export const dynamic = "force-dynamic";

// All known object types in the Vastu engine system
const ALL_OBJECT_TYPES = [
  // Core / Basic
  "Toilet", "Kitchen", "Master Bedroom", "Main Gate", "Main Entry", "Pooja", "Entrance", "Exit", "Dosa Bhatti", "Heavy Machinery", "Reception",
  // Living & Furniture
  "Children Bedroom", "Family Lounge", "Guest Room", "Servent Room", "Sofa Set", "Bed", "Tv",
  "Dining Room", "Fridge", "Microwave", "Water Tap", "Stove",
  "Washing Machine", "Dustbin", "Waste Material", "Shoerack", "Footwear Rank", "Iron Almira", "Dressing Table", "Cupbaord", "Wardrobe",
  "Heater", "Water Heater", "Ac", "Air Conditioner",
  "Parking", "Staircase", "Lift", "Septic Tank", "Pots", "Plants",
  // Commercial Basic
  "Water Tank", "Security Cabin", "Work Table", "Sink Unit", "Dish Rack", "Pickup Counter", "Serving Counter",
  "Cash Counter", "Billing Desk", "Display Shelf", "Product Display", "Store Room",
  "Manager Cabin", "Meeting Room", "Workstations", "HR Cabin",
  "Small Machinery", "Raw Material Storage", "Finished Goods Storage", "Warehouse Rack",
  "Pharmacy", "Consultation Room", "Waiting Area", "Lab",
  "Cold Storage", "Refrigerator", "Prep Area", "Wash Area", "Cooking Area",
  // Premium & Elemental (Advanced Only)
  "Aquarium", "Bar", "Music System", "Swing", "Generator", "Inverter", "Borewell",
  "Overhead Tank", "Underground Tank", "Fire Element", "Water Element", "Air Element", "Earth Element", "Space Element"
];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json(
      { error: "Unauthorized access" },
      { status: 401 }
    );
  }

  const userId = (session.user as any).id;

  try {
    const profile = await prisma.profiles.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        valid_from: true,
        valid_to: true,
      },
    });

    const userCredits = await prisma.user_credits.findUnique({
      where: { user_id: userId },
      select: { credits: true },
    });

    const now = new Date();
    const isAstrologerActive =
      profile?.role === "astrologer" &&
      profile.valid_from &&
      profile.valid_to &&
      now >= new Date(profile.valid_from) &&
      now <= new Date(profile.valid_to);

    let userPlan: PlanTier = "free";
    let activeSubscription = null;

    if (profile?.role === "admin" || isAstrologerActive) {
      userPlan = "advanced";
    } else {
      const subscription = await prisma.user_subscriptions.findFirst({
        where: {
          user_id: userId,
          status: { in: ["active", "trialing"] },
          expires_at: { gt: now },
        },
        include: { plans: true },
        orderBy: { created_at: "desc" },
      });

      if (subscription) {
        activeSubscription = {
          id: subscription.id,
          planId: subscription.plan_id,
          planName: subscription.plans?.name || "Subscription",
          expiresAt: subscription.expires_at,
          status: subscription.status,
        };

        const planName = subscription.plans?.name?.toLowerCase() ?? "";
        if (planName.includes("advanced") || planName.includes("pro")) {
          userPlan = "advanced";
        } else {
          userPlan = "basic";
        }
      }
    }

    const limits = PLAN_LIMITS[userPlan];

    // Build server-validated list of accessible objects
    let allowedObjects: string[] = [];
    if (userPlan === "advanced") {
      allowedObjects = ALL_OBJECT_TYPES;
    } else if (userPlan === "basic") {
      allowedObjects = ALL_OBJECT_TYPES.filter(
        (obj) => FREE_TIER_OBJECTS.has(obj) || BASIC_TIER_OBJECTS.has(obj)
      );
    } else {
      allowedObjects = ALL_OBJECT_TYPES.filter((obj) =>
        FREE_TIER_OBJECTS.has(obj)
      );
    }

    return NextResponse.json({
      access: {
        userId,
        email: session.user.email,
        plan: userPlan,
        role: profile?.role || "user",
        maxUploads: limits.maxUploads,
        maxRelocationsPerObject: limits.maxRelocationsPerObject,
        allowedObjects,
        credits: userCredits?.credits ?? 0,
        hasActiveSubscription: !!activeSubscription || !!isAstrologerActive || profile?.role === "admin",
        subscription: activeSubscription,
      },
    });
  } catch (error) {
    console.error("Error evaluating user access:", error);
    return NextResponse.json(
      { error: "Failed to evaluate access permissions" },
      { status: 500 }
    );
  }
}

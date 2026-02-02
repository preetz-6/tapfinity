import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* ---------- USER KPIs ---------- */
  const [
    totalUsers,
    activeUsers,
    blockedUsers,
    totalBalanceAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "BLOCKED" } }),
    prisma.user.aggregate({
      _sum: { balance: true },
    }),
  ]);

  /* ---------- MERCHANT KPIs ---------- */
  const [
    totalMerchants,
    activeMerchants,
    blockedMerchants,
  ] = await Promise.all([
    prisma.merchant.count(),
    prisma.merchant.count({ where: { status: "ACTIVE" } }),
    prisma.merchant.count({ where: { status: "BLOCKED" } }),
  ]);

  /* ---------- LAST 7 DAYS TX (LINE CHART) ---------- */
  const since = new Date();
  since.setDate(since.getDate() - 6);

  const txLast7Days = await prisma.transaction.groupBy({
    by: ["createdAt"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });

  const txByDay = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const day = d.toISOString().slice(0, 10);

    const count =
      txLast7Days.find(
        t => t.createdAt.toISOString().slice(0, 10) === day
      )?._count._all ?? 0;

    return { day, count };
  });

  /* ---------- TX TYPE SPLIT ---------- */
  const txTypeSplit = await prisma.transaction.groupBy({
    by: ["type"],
    _count: { _all: true },
  });

  /* ---------- RECENT TRANSACTIONS ---------- */
  const recentTransactions = await prisma.transaction.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
    },
  });

  /* ---------- RECENT ADMIN ACTIONS ---------- */
  const recentActions = await prisma.adminActionLog.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      admin: { select: { name: true } },
    },
  });

  return NextResponse.json({
    kpis: {
      users: {
        total: totalUsers,
        active: activeUsers,
        blocked: blockedUsers,
        totalBalance: totalBalanceAgg._sum.balance ?? 0,
      },
      merchants: {
        total: totalMerchants,
        active: activeMerchants,
        blocked: blockedMerchants,
      },
    },
    txByDay,
    txTypeSplit,
    recentTransactions,
    recentActions,
  });
}

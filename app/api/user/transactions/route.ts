import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "USER") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const txs = await prisma.transaction.findMany({
    where: {
      userId: token.id as string,
      status: "SUCCESS",
      type: { in: ["DEBIT", "CREDIT"] },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      merchantLinks: {
        include: {
          merchant: {
            select: { name: true },
          },
        },
      },
      admin: {
        select: { name: true },
      },
    },
  });

  const formatted = txs.map(tx => ({
    id: tx.id,
    amount: tx.amount,
    type: tx.type,
    createdAt: tx.createdAt,
    merchant:
      tx.type === "DEBIT"
        ? tx.merchantLinks[0]?.merchant.name ?? "Merchant"
        : tx.admin?.name
        ? `Top-up by ${tx.admin.name}`
        : "Wallet Top-up",
  }));

  return NextResponse.json(formatted);
}

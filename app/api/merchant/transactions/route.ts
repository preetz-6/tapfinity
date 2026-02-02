import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "MERCHANT") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const merchantId = (session.user as any).id;

  const txs = await prisma.merchantTransaction.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      tx: {
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  return NextResponse.json({
    transactions: txs.map((t) => t.tx),
  });
}

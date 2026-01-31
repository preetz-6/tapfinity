import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashCardSecret } from "@/lib/hashCardSecret";
import { getToken } from "next-auth/jwt";

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, cardSecret } = await req.json();

    if (!userId || !cardSecret) {
      return NextResponse.json(
        { error: "Missing userId or cardSecret" },
        { status: 400 }
      );
    }

    const cardSecretHash = hashCardSecret(cardSecret);

    await prisma.user.update({
      where: { id: userId },
      data: { cardSecretHash },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PROVISION CONFIRM ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

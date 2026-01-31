import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { hashCardSecret } from "@/lib/hashCardSecret";
import { verifyAdminPin } from "@/lib/verifyAdminPin";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, pin } = body;

    if (!userId || !pin) {
      return NextResponse.json(
        { error: "User ID and PIN required" },
        { status: 400 }
      );
    }

    const pinCheck = await verifyAdminPin(token.id as string, pin);
    if (!pinCheck.ok) {
      return NextResponse.json(
        { error: pinCheck.error },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.cardSecretHash) {
      return NextResponse.json(
        { error: "User already has a provisioned card" },
        { status: 409 }
      );
    }

    /* 🔐 Generate card secret */
    const cardSecret = crypto.randomUUID();
    const cardSecretHash = hashCardSecret(cardSecret);

    /* ❗ DO NOT STORE YET — UI must confirm NFC write */
    return NextResponse.json({
      ok: true,
      cardSecret,
    });
  } catch (err) {
    console.error("PROVISION PREP ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

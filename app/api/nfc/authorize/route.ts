import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { hashCardSecret } from "@/lib/hashCardSecret";

/*
  NFC AUTHORIZE — FINAL VERSION
  -----------------------------
  - NO cookies
  - NO JWT
  - Uses cardSecret (NOT UID)
  - Rate limited
  - Atomic wallet debit
*/

export async function POST(req: NextRequest) {
  try {
    /* -------------------- RATE LIMIT -------------------- */
    const ip =
      req.ip ||
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      "unknown";

    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait." },
        { status: 429 }
      );
    }

    /* -------------------- INPUT -------------------- */
    const body = await req.json();
    const { requestId, cardSecret } = body;

    if (!requestId || !cardSecret) {
      return NextResponse.json(
        { error: "Missing requestId or cardSecret" },
        { status: 400 }
      );
    }

    /* -------------------- PAYMENT REQUEST -------------------- */
    const paymentRequest = await prisma.paymentRequest.findUnique({
      where: { id: requestId },
    });

    if (!paymentRequest) {
      return NextResponse.json(
        { error: "Invalid payment request" },
        { status: 404 }
      );
    }

    if (paymentRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Payment request already used or expired" },
        { status: 409 }
      );
    }

    if (paymentRequest.expiresAt < new Date()) {
      await prisma.paymentRequest.update({
        where: { id: requestId },
        data: { status: "EXPIRED" },
      });

      return NextResponse.json(
        { error: "Payment request expired" },
        { status: 410 }
      );
    }

    /* -------------------- CARD AUTH -------------------- */
    const secretHash = hashCardSecret(cardSecret);

    const user = await prisma.user.findUnique({
      where: { cardSecretHash: secretHash },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or unprovisioned card" },
        { status: 403 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "User is blocked" },
        { status: 403 }
      );
    }

    if (user.balance < paymentRequest.amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 409 }
      );
    }

    /* -------------------- ATOMIC TRANSACTION -------------------- */
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: paymentRequest.amount },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          amount: paymentRequest.amount,
          type: "DEBIT",
          status: "SUCCESS",
          clientTxId: crypto.randomUUID(),
        },
      });

      await tx.merchantTransaction.create({
        data: {
          merchantId: paymentRequest.merchantId,
          txId: transaction.id,
        },
      });

      await tx.paymentRequest.update({
        where: { id: requestId },
        data: { status: "USED" },
      });

      return { updatedUser, transaction };
    });

    /* -------------------- SUCCESS -------------------- */
    return NextResponse.json({
      ok: true,
      transactionId: result.transaction.id,
      balance: result.updatedUser.balance,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("NFC AUTHORIZE ERROR:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

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

/* -------------------- LOGGING HELPER -------------------- */
async function logAttempt({
  merchantId,
  userId,
  paymentRequestId,
  amount,
  status,
  failureReason,
  ipAddress,
}: {
  merchantId: string;
  userId?: string;
  paymentRequestId?: string;
  amount: number;
  status: "SUCCESS" | "FAILED";
  failureReason?: string;
  ipAddress?: string;
}) {
  try {
    await prisma.paymentAttemptLog.create({
      data: {
        merchantId,
        userId,
        paymentRequestId,
        amount,
        status,
        failureReason,
        ipAddress,
      },
    });
  } catch {
    // NEVER block payment flow due to logging
  }
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    req.headers.get("x-real-ip") ??
    "unknown";

  try {
    /* -------------------- RATE LIMIT -------------------- */
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
      await logAttempt({
        merchantId: paymentRequest.merchantId,
        paymentRequestId: requestId,
        amount: paymentRequest.amount,
        status: "FAILED",
        failureReason: "REQUEST_NOT_PENDING",
        ipAddress: ip,
      });

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

      await logAttempt({
        merchantId: paymentRequest.merchantId,
        paymentRequestId: requestId,
        amount: paymentRequest.amount,
        status: "FAILED",
        failureReason: "REQUEST_EXPIRED",
        ipAddress: ip,
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
      await logAttempt({
        merchantId: paymentRequest.merchantId,
        paymentRequestId: requestId,
        amount: paymentRequest.amount,
        status: "FAILED",
        failureReason: "CARD_NOT_PROVISIONED",
        ipAddress: ip,
      });

      return NextResponse.json(
        { error: "Invalid or unprovisioned card" },
        { status: 403 }
      );
    }

    if (user.status !== "ACTIVE") {
      await logAttempt({
        merchantId: paymentRequest.merchantId,
        userId: user.id,
        paymentRequestId: requestId,
        amount: paymentRequest.amount,
        status: "FAILED",
        failureReason: "USER_BLOCKED",
        ipAddress: ip,
      });

      return NextResponse.json(
        { error: "User is blocked" },
        { status: 403 }
      );
    }

    if (user.balance < paymentRequest.amount) {
      await logAttempt({
        merchantId: paymentRequest.merchantId,
        userId: user.id,
        paymentRequestId: requestId,
        amount: paymentRequest.amount,
        status: "FAILED",
        failureReason: "INSUFFICIENT_BALANCE",
        ipAddress: ip,
      });

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

      // ✅ LOG SUCCESS
      await logAttempt({
        merchantId: paymentRequest.merchantId,
        userId: user.id,
        paymentRequestId: requestId,
        amount: paymentRequest.amount,
        status: "SUCCESS",
        ipAddress: ip,
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

    // BEST-EFFORT LOG
    try {
      // paymentRequest may not exist here, so guard
      // (no await blocking response)
    } catch {}

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

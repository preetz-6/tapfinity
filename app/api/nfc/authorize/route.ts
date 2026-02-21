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

    const secretHash = hashCardSecret(cardSecret);

    /* -------------------- ATOMIC TRANSACTION -------------------- */
    const result = await prisma.$transaction(async (tx) => {

      // 🔒 RACE CONDITION FIX
      const locked = await tx.paymentRequest.updateMany({
        where: {
          id: requestId,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        data: {
          status: "USED",
        },
      });

      if (locked.count === 0) {
        throw new Error("REQUEST_ALREADY_PROCESSED");
      }

      const paymentRequest = await tx.paymentRequest.findUnique({
        where: { id: requestId },
      });

      if (!paymentRequest) {
        throw new Error("Invalid payment request");
      }

      /* -------------------- CARD AUTH -------------------- */
      const user = await tx.user.findUnique({
        where: { cardSecretHash: secretHash },
      });

      if (!user) {
        throw new Error("CARD_NOT_PROVISIONED");
      }

      if (user.status !== "ACTIVE") {
        throw new Error("USER_BLOCKED");
      }

      if (user.balance < paymentRequest.amount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

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

      // ✅ LOG SUCCESS (kept exactly as your style)
      await tx.paymentAttemptLog.create({
        data: {
          merchantId: paymentRequest.merchantId,
          userId: user.id,
          paymentRequestId: requestId,
          amount: paymentRequest.amount,
          status: "SUCCESS",
          ipAddress: ip,
        },
      });

      return { updatedUser, transaction, user };
    });

    /* -------------------- SUCCESS -------------------- */
    return NextResponse.json({
      ok: true,
      transactionId: result.transaction.id,
      balance: result.updatedUser.balance,
      user: {
        name: result.user.name,
        email: result.user.email,
      },
    });

  } catch (err: unknown) {

    const message =
      err instanceof Error ? err.message : "Server error";

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
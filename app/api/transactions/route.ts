import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type TxType = "DEBIT" | "CREDIT";

/* -------------------- GET: Admin fetch transactions -------------------- */
export async function GET() {
  const session = await getServerSession(authOptions);

  type SessionUser = {
  role?: "ADMIN" | "USER" | "MERCHANT";
};

  if (!session || (session.user as SessionUser).role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ transactions });
}

/* -------------------- POST: Device / MQTT transaction -------------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, deviceId, amount, type, clientTxId } = body as {
      uid: string;
      deviceId?: string;
      amount: number;
      type: TxType;
      clientTxId: string;
    };

    // -------- Validation --------
    if (!uid || !clientTxId || !type || !amount || amount <= 0) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_INPUT",
          message: "Missing or invalid request data",
        },
        { status: 400 }
      );
    }

    // -------- Idempotency check --------
    const existingTx = await prisma.transaction.findUnique({
      where: { clientTxId },
    });

    if (existingTx) {
      return NextResponse.json({
        ok: true,
        transactionId: existingTx.id,
        message: "Duplicate request – already processed",
      });
    }

    // -------- Fetch user --------
    const user = await prisma.user.findUnique({
      where: { rfidUid: uid },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, code: "USER_NOT_FOUND", message: "Unknown UID" },
        { status: 404 }
      );
    }

    if (user.status === "BLOCKED") {
      return NextResponse.json(
        { ok: false, code: "USER_BLOCKED", message: "User is blocked" },
        { status: 403 }
      );
    }

    // -------- Business rules --------
    if (type === "DEBIT" && user.balance < amount) {
      return NextResponse.json(
        {
          ok: false,
          code: "INSUFFICIENT_BALANCE",
          message: "Balance too low",
        },
        { status: 409 }
      );
    }

    // -------- Atomic transaction --------
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser =
        type === "DEBIT"
          ? await tx.user.update({
              where: { id: user.id },
              data: { balance: { decrement: amount } },
            })
          : await tx.user.update({
              where: { id: user.id },
              data: { balance: { increment: amount } },
            });

      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          amount,
          type,
          status: "SUCCESS",
          deviceId: deviceId ?? null,
          clientTxId,
        },
      });

      return { transaction, updatedUser };
    });

    return NextResponse.json({
      ok: true,
      transactionId: result.transaction.id,
      balance: result.updatedUser.balance,
    });
  } catch (err) {
    console.error("TX error:", err);
    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}

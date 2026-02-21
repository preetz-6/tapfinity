import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 🔥 SOFT DELETE
    await prisma.$transaction(async (tx) => {
      // 1️⃣ Remove NFC binding
      await tx.user.update({
        where: { id: userId },
        data: {
          status: "BLOCKED",
          cardSecretHash: null,
          balance: 0,
        },
      });

      // 2️⃣ Expire active provision requests
      await tx.provisionCardRequest.updateMany({
        where: {
          userId,
          status: "PENDING",
        },
        data: { status: "EXPIRED" },
      });

      // 3️⃣ Log admin action
      await tx.adminActionLog.create({
        data: {
          adminId: token.id as string,
          actionType: "DELETE_USER",
          targetType: "USER",
          targetIdentifier: user.email,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      message: "User deleted (soft delete)",
    });

  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
"use client";

import { useEffect, useState } from "react";
import UserShell from "./UserShell";
import SpendChart from "./components/SpendChart";
import MerchantChart from "./components/MerchantChart";

/* ===================== TYPES ===================== */
type UserStatus = "ACTIVE" | "BLOCKED";

type UserTx = {
  id: string;
  amount: number;
  type: "DEBIT" | "CREDIT";
  createdAt: string;
};

export default function DashboardPage() {
  const [balance, setBalance] = useState(0);
  const [status, setStatus] = useState<UserStatus>("ACTIVE");
  const [spent30, setSpent30] = useState(0);

  useEffect(() => {
    async function load() {
      /* ---------- USER META ---------- */
      const meRes = await fetch("/api/user/me", {
        cache: "no-store",
      });
      const me = await meRes.json();

      setBalance(me.balance);
      setStatus(me.status);

      /* ---------- TRANSACTIONS ---------- */
      const txRes = await fetch("/api/user/transactions", {
        cache: "no-store",
      });
      const txs: UserTx[] = await txRes.json();

      const last30 = new Date();
      last30.setDate(last30.getDate() - 30);

      const spent = txs
        .filter(
          tx =>
            tx.type === "DEBIT" &&
            new Date(tx.createdAt) >= last30
        )
        .reduce((sum, tx) => sum + tx.amount, 0);

      setSpent30(spent);
    }

    load();
  }, []);

  return (
    <UserShell>
      <h1 className="text-2xl font-semibold mb-6">
        Wallet Overview
      </h1>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl bg-orange-500/10 p-6 border border-orange-500/20">
          <p className="text-sm text-orange-300">
            Current Balance
          </p>
          <p className="text-3xl font-bold mt-2">
            ₹ {balance}
          </p>
        </div>

        <div className="rounded-xl bg-white/5 p-6 border border-white/10">
          <p className="text-sm text-gray-400">Status</p>
          <span
            className={`inline-block mt-2 rounded-full px-3 py-1 text-sm ${
              status === "ACTIVE"
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="rounded-xl bg-white/5 p-6 border border-white/10">
          <p className="text-sm text-gray-400">
            Spent (Last 30 days)
          </p>
          <p className="text-2xl font-semibold mt-2">
            ₹ {spent30}
          </p>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SpendChart />
        <MerchantChart />
      </div>
    </UserShell>
  );
}

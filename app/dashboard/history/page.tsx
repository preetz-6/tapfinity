"use client";

import { useEffect, useState } from "react";
import UserShell from "../UserShell";

type Tx = {
  id: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  merchant: string;
  createdAt: string;
};

export default function HistoryPage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/transactions", {
      cache: "no-store",
    })
      .then(res => res.json())
      .then(data => {
        setTxs(data);
        setLoading(false);
      });
  }, []);

  return (
    <UserShell>
      <h1 className="text-2xl font-semibold mb-6">
        Transaction History
      </h1>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Amount</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={3}
                  className="p-6 text-center text-gray-400"
                >
                  Loading transactions…
                </td>
              </tr>
            )}

            {!loading && txs.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="p-6 text-center text-gray-400"
                >
                  No transactions yet
                </td>
              </tr>
            )}

            {txs.map(tx => (
              <tr
                key={tx.id}
                className="border-t border-white/10"
              >
                <td className="p-3">
                  {new Date(tx.createdAt).toLocaleString()}
                </td>

                <td className="p-3">
                  {tx.merchant}
                </td>

                <td
                  className={`p-3 font-medium ${
                    tx.type === "CREDIT"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {tx.type === "CREDIT" ? "+" : "-"} ₹ {tx.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </UserShell>
  );
}

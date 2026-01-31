"use client";

import { useEffect, useState } from "react";

type Transaction = {
  id: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  status: "SUCCESS" | "FAILED" | "QUEUED";
  createdAt: string;
  user: {
    email: string;
  };
  admin?: {
    email: string;
    name: string;
  } | null;
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions")
      .then(res => res.json())
      .then(data => {
        setTransactions(data.transactions || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading transactions…</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Transactions</h1>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-gray-400">
            <tr>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Source</th>
              <th className="p-3 text-left">Time</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map(tx => (
              <tr
                key={tx.id}
                className="border-t border-white/10 hover:bg-white/5"
              >
                <td className="p-3">{tx.user?.email}</td>

                <td
                  className={`p-3 font-medium ${
                    tx.type === "CREDIT"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {tx.type}
                </td>

                <td className="p-3">₹ {tx.amount}</td>

                <td className="p-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      tx.status === "SUCCESS"
                        ? "bg-green-500/20 text-green-400"
                        : tx.status === "FAILED"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>

                <td className="p-3">
                  {tx.admin ? (
                    <span className="text-blue-400">ADMIN</span>
                  ) : (
                    <span className="text-gray-400">DEVICE</span>
                  )}
                </td>

                <td className="p-3 text-gray-400">
                  {new Date(tx.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

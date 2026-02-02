"use client";

import { useEffect, useState } from "react";

type Tx = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
};

export default function MerchantTransactions() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/merchant/transactions");
      const data = await res.json();
      setTxs(data.transactions || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-semibold mb-6">
        Transactions
      </h1>

      {loading && <p className="text-gray-400">Loading…</p>}

      {!loading && txs.length === 0 && (
        <p className="text-gray-400">No transactions yet</p>
      )}

      {!loading && txs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-800 rounded-xl overflow-hidden">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Time</th>
              </tr>
            </thead>

            <tbody>
              {txs.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-t border-gray-800 hover:bg-gray-800/40"
                >
                  <td className="p-3">₹{tx.amount}</td>
                  <td
                    className={`p-3 ${
                      tx.status === "SUCCESS"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {tx.status}
                  </td>
                  <td className="p-3 text-gray-400 text-sm">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

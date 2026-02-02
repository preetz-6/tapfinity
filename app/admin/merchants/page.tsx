"use client";

import { useEffect, useState } from "react";
import CreateMerchantModal from "./CreateMerchantModal";

type Merchant = {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "BLOCKED";
  createdAt: string;
};

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchMerchants() {
    const res = await fetch("/api/admin/merchants");
    const data = await res.json();
    setMerchants(data.merchants || []);
  }

  async function toggleStatus(merchant: Merchant) {
    await fetch("/api/admin/merchants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchantId: merchant.id,
        status: merchant.status === "ACTIVE" ? "BLOCKED" : "ACTIVE",
      }),
    });

    await fetchMerchants();
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/merchants");
        const data = await res.json();

        if (!cancelled) {
          setMerchants(data.merchants || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Merchant Management</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          + Create Merchant
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading merchants...</p>
      ) : (
        <div className="bg-black/40 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-black/60">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((m) => (
                <tr key={m.id} className="border-t border-white/10">
                  <td className="p-3">{m.name}</td>
                  <td className="p-3">{m.email}</td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        m.status === "ACTIVE"
                          ? "bg-green-600"
                          : "bg-red-600"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => toggleStatus(m)}
                      className={`px-3 py-1 rounded ${
                        m.status === "ACTIVE"
                          ? "bg-yellow-600"
                          : "bg-green-600"
                      }`}
                    >
                      {m.status === "ACTIVE" ? "Block" : "Unblock"}
                    </button>

                    <a
                      href={`/admin/merchants/${m.id}/transactions`}
                      className="bg-blue-600 px-3 py-1 rounded inline-block"
                    >
                      Transactions
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateMerchantModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchMerchants}
        />
      )}
    </div>
  );
}

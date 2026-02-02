"use client";

import { useState } from "react";
import PinModal from "@/app/components/PinModal";

export default function TopUpModal({
  open,
  userId,
  onClose,
  onSuccess,
}: {
  open: boolean;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function submit(pin: string) {
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        amount: Number(amount),
        pin,
        action: "TOP_UP",
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Top-up failed");
      return;
    }

    setPinOpen(false);
    onClose();
    onSuccess();
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center">
        <div className="w-full max-w-sm rounded-xl bg-[#0b1226] p-6 border border-white/10">
          <h2 className="text-lg font-semibold mb-4">Top-up Wallet</h2>

          <input
            type="number"
            placeholder="Amount"
            className="w-full rounded-lg bg-black/30 border border-white/10 p-3 mb-4"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />

          {error && <p className="text-sm text-red-400 mb-2">{error}</p>}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 border border-white/10 rounded-lg py-2">
              Cancel
            </button>
            <button
              onClick={() => setPinOpen(true)}
              className="flex-1 bg-green-600 rounded-lg py-2"
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      <PinModal
        open={pinOpen}
        loading={loading}
        error={error}
        onClose={() => setPinOpen(false)}
        onSubmit={submit}
      />
    </>
  );
}

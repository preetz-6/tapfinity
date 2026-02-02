"use client";

import { useState, useEffect } from "react";

export default function PinModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  error = "",
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  loading?: boolean;
  error?: string;
}) {
  const [pin, setPin] = useState("");

  // 🔥 RESET PIN EVERY TIME MODAL OPENS
  useEffect(() => {
    if (open) {
      setPin("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-xl bg-[#0b1226] p-6 border border-white/10">
        <h2 className="text-lg font-semibold mb-2">Confirm with PIN</h2>
        <p className="text-sm text-gray-400 mb-4">
          Enter your 6-digit admin PIN to continue
        </p>

        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="••••••"
          className="w-full rounded-lg bg-black/30 border border-white/10 p-3 text-center tracking-widest text-lg"
        />

        {error && (
          <p className="mt-2 text-sm text-red-400 text-center">{error}</p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 py-2 text-sm"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={() => onSubmit(pin)}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm"
            disabled={loading || pin.length !== 6}
          >
            {loading ? "Verifying…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

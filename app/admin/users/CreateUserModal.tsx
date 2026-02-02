"use client";

import { useState } from "react";
import PinModal from "@/app/components/PinModal";

export default function CreateUserModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function submit(pin: string) {
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, pin }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to create user");
      return;
    }

    setPinOpen(false);
    onClose();
    onSuccess();
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center">
        <div className="w-full max-w-md rounded-xl bg-[#0b1226] p-6 border border-white/10">
          <h2 className="text-lg font-semibold mb-4">Create User</h2>

          <input
            placeholder="Name"
            className="mb-3 w-full rounded-lg bg-black/30 border border-white/10 p-3"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <input
            placeholder="Email"
            className="mb-3 w-full rounded-lg bg-black/30 border border-white/10 p-3"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="mb-4 w-full rounded-lg bg-black/30 border border-white/10 p-3"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {error && <p className="text-sm text-red-400 mb-2">{error}</p>}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 border border-white/10 rounded-lg py-2">
              Cancel
            </button>
            <button
              onClick={() => setPinOpen(true)}
              className="flex-1 bg-blue-600 rounded-lg py-2"
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

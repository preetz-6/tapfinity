"use client";

import { useEffect, useState } from "react";
import UserShell from "../UserShell";

export default function CardPage() {
  const [status, setStatus] = useState<"ACTIVE" | "BLOCKED">("ACTIVE");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/user/me")
      .then(res => res.json())
      .then(data => {
        setStatus(data.status);
      });
  }, []);

  async function blockCard() {
    setLoading(true);

    const res = await fetch("/api/user/block-card", {
      method: "POST",
    });

    setLoading(false);

    if (res.ok) {
      setStatus("BLOCKED");
    } else {
      alert("Failed to block card");
    }
  }

  return (
    <UserShell>
      <h1 className="text-2xl font-semibold mb-6">
        Card Status
      </h1>

      <div className="max-w-md rounded-xl bg-white/5 p-6 border border-white/10">
        <p className="text-sm text-gray-400 mb-2">
          Card Status
        </p>

        <p
          className={`mb-6 font-medium ${
            status === "ACTIVE"
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {status}
        </p>

        <button
          onClick={blockCard}
          disabled={status === "BLOCKED" || loading}
          className={`rounded-lg px-4 py-2 text-white ${
            status === "BLOCKED"
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {loading
            ? "Blocking..."
            : status === "BLOCKED"
            ? "Card Blocked"
            : "Block Card"}
        </button>

        <p className="text-xs text-gray-400 mt-4">
          Blocking your card will immediately prevent all payments.
          Contact admin to re-enable access.
        </p>
      </div>
    </UserShell>
  );
}

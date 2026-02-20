"use client";

import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface NDEFWriteOptions {
    records: Array<{
      recordType: string;
      data: string;
    }>;
  }

  interface NDEFReader {
    write(data: NDEFWriteOptions): Promise<void>;
  }

  interface Window {
    NDEFReader: {
      new (): NDEFReader;
    };
  }
}

type ProvisionUser = {
  id: string;
  email: string;
  hasCard: boolean;
};

type Status = "WAITING" | "SUCCESS" | "CANCELLED";

export default function ProvisionCardModal({
  open,
  user,
  pin,
  onClose,
}: {
  open: boolean;
  user: ProvisionUser | null;
  pin: string;
  onClose: () => void;
}) {
  /* ---------------- STATE ---------------- */
  const [requestId, setRequestId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("WAITING");
  const [secondsLeft, setSecondsLeft] = useState(20);

  const pollRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  /* ---------------- CLEANUP ---------------- */
  const cleanup = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /* ---------------- CANCEL ---------------- */
  const handleCancel = useCallback(() => {
    cleanup();
    setStatus("CANCELLED");
    setTimeout(onClose, 300);
  }, [cleanup, onClose]);

  /* ---------------- NFC WRITE ---------------- */
  async function writeCard(reqId: string) {
    if (!("NDEFReader" in window)) {
      alert("Web NFC not supported on this device/browser.");
      handleCancel();
      return;
    }

    try {
      const secret = crypto.randomUUID();

      const ndef = new window.NDEFReader();

      await ndef.write({
        records: [
          {
            recordType: "text",
            data: JSON.stringify({
              tpf: "1",
              secret,
            }),
          },
        ],
      });

      await fetch("/api/admin/provision-card/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: reqId,
          cardSecret: secret,
        }),
      });

    } catch (err) {
      console.error("NFC Write Failed:", err);
      alert("Failed to write card.");
      handleCancel();
    }
  }

  /* ---------------- CREATE REQUEST ---------------- */
  useEffect(() => {
    if (!open || !user) return;

    async function createRequest() {
      const res = await fetch("/api/admin/provision-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user!.id,   // non-null assertion (safe)
          pin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to create provision request");
        onClose();
        return;
      }

      setRequestId(data.requestId);
      setStatus("WAITING");
      setSecondsLeft(20);

      // 🔥 REAL NFC WRITE
      await writeCard(data.requestId);
    }

    createRequest();
    return cleanup;
  }, [open, user, pin, cleanup, onClose]);

  /* ---------------- COUNTDOWN ---------------- */
  useEffect(() => {
    if (!open || status !== "WAITING") return;

    timerRef.current = window.setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          handleCancel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [open, status, handleCancel]);

  /* ---------------- POLLING ---------------- */
  useEffect(() => {
    if (!open || !requestId || status !== "WAITING") return;

    pollRef.current = window.setInterval(async () => {
      const res = await fetch(
        `/api/admin/provision-card/confirm?requestId=${requestId}`
      );

      if (!res.ok) return;

      const data = await res.json();

      if (data.status === "COMPLETED") {
        cleanup();
        setStatus("SUCCESS");
      }
    }, 1500);

    return () => {
      if (pollRef.current !== null) {
        clearInterval(pollRef.current);
      }
    };
  }, [open, requestId, status, cleanup]);

  /* ---------------- RENDER ---------------- */
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#0b1226] p-8 rounded-xl w-full max-w-md text-center border border-white/10">
        {status === "WAITING" && (
          <>
            <h2 className="text-xl font-semibold mb-2">
              Tap Card Now
            </h2>

            {user.hasCard && (
              <p className="text-yellow-400 text-sm mb-3">
                ⚠️ Existing card will be overwritten
              </p>
            )}

            <p className="text-gray-400 mb-4">
              Hold the card near the phone
            </p>

            <div className="animate-pulse text-6xl mb-4">📶</div>

            <p className="text-sm text-gray-400 mb-2">
              Time left:{" "}
              <span className="text-white font-semibold">
                {secondsLeft}s
              </span>
            </p>

            {requestId && (
              <p className="text-xs text-gray-500 break-all mb-4">
                Request ID: {requestId}
              </p>
            )}

            <button
              onClick={handleCancel}
              className="rounded-lg bg-red-600 px-5 py-2 text-sm"
            >
              Cancel
            </button>
          </>
        )}

        {status === "SUCCESS" && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-semibold mb-4">
              Card Linked Successfully
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg bg-blue-600 px-6 py-2"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
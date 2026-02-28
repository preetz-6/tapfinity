"use client";

import { useEffect, useState, useRef } from "react";
import PaymentSuccess from "../../components/PaymentSuccess";
import PaymentFailure from "../../components/PaymentFailure";

declare global {
  interface NDEFScanRecord {
    recordType: string;
    data?: DataView;
  }

  interface NDEFReadingEvent {
    message: {
      records: NDEFScanRecord[];
    };
  }

  interface NDEFReader {
    scan(): Promise<void>;
    onreading: ((event: NDEFReadingEvent) => void) | null;
    abort(): Promise<void>;
  }

  interface Window {
    NDEFReader: {
      new (): NDEFReader;
    };
  }
}

type State = "ENTER" | "WAITING" | "SUCCESS" | "FAILED";

const WAIT_SECONDS = 15;

export default function ReceivePayment() {
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<State>("ENTER");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(WAIT_SECONDS);

  const nfcStartedRef = useRef(false);
  const nfcProcessedRef = useRef(false);
  const ndefRef = useRef<NDEFReader | null>(null);

  async function createRequest() {
    setError("");

    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }

    const res = await fetch("/api/merchant/payment-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount) }),
    });

    const data = await res.json();

    if (!data.ok) {
      setError(data.error || "Failed to create request");
      return;
    }

    setRequestId(data.requestId);
    setTimeLeft(WAIT_SECONDS);
    setState("WAITING");
  }

  async function startNfcReader(reqId: string) {
    if (!("NDEFReader" in window)) {
      alert("Web NFC not supported on this device/browser.");
      return;
    }

    try {
      const ndef = new window.NDEFReader();
      ndefRef.current = ndef;

      await ndef.scan();

      ndef.onreading = async (event) => {
        if (nfcProcessedRef.current) return;
        nfcProcessedRef.current = true;

        if (!event.message.records.length) {
          setState("FAILED");
          return;
        }

        const record = event.message.records[0];
        if (!record.data) {
          setState("FAILED");
          return;
        }

        try {
          const decoder = new TextDecoder();
          const decoded = decoder.decode(record.data);
          const parsed = JSON.parse(decoded);

          if (!parsed.secret) {
            setState("FAILED");
            return;
          }

          const res = await fetch("/api/nfc/authorize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestId: reqId,
              cardSecret: parsed.secret,
            }),
          });

          const result = await res.json();

          if (result.ok) setState("SUCCESS");
          else setState("FAILED");

        } catch {
          setState("FAILED");
        }

        try {
          await ndef.abort();
        } catch {}
      };

    } catch (err) {
      console.error("NFC Read Error:", err);
    }
  }

  useEffect(() => {
    if (state === "WAITING" && requestId && !nfcStartedRef.current) {
      nfcStartedRef.current = true;
      nfcProcessedRef.current = false;
      startNfcReader(requestId);
    }
  }, [state, requestId]);

  useEffect(() => {
    if (state !== "WAITING") return;

    const timer = setTimeout(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setState("FAILED");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [state, timeLeft]);

  useEffect(() => {
    if (!requestId || state !== "WAITING" || timeLeft <= 0) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/merchant/payment-request/${requestId}`);
      if (!res.ok) return;

      const data = await res.json();

      if (data.status === "USED") {
        setState("SUCCESS");
        clearInterval(interval);
      }

      if (data.status === "EXPIRED") {
        setState("FAILED");
        clearInterval(interval);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [requestId, state, timeLeft]);

  function reset() {
    setAmount("");
    setRequestId(null);
    setTimeLeft(WAIT_SECONDS);
    setState("ENTER");
    nfcStartedRef.current = false;
    nfcProcessedRef.current = false;

    try {
      ndefRef.current?.abort();
    } catch {}
  }

  useEffect(() => {
    if (state !== "SUCCESS") return;
    const timer = setTimeout(reset, 3000);
    return () => clearTimeout(timer);
  }, [state]);

  async function cancelRequest() {
    if (requestId) {
      await fetch(`/api/merchant/payment-request/${requestId}`, {
        method: "DELETE",
      });
    }
    reset();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="w-full max-w-md bg-gray-900 p-6 sm:p-8 rounded-2xl shadow-2xl">

        {state === "ENTER" && (
          <div className="space-y-4">
            <h1 className="text-xl sm:text-2xl font-semibold">
              Enter Amount
            </h1>

            <input
              type="number"
              placeholder="₹ Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-4 rounded-xl bg-gray-800 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              onClick={createRequest}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 text-lg font-semibold active:scale-95 transition"
            >
              Continue
            </button>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
          </div>
        )}

        {state === "WAITING" && (
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
              <div className="absolute w-full h-full rounded-full bg-indigo-500/30 animate-ping" />
              <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-indigo-500/40 animate-pulse" />
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-pink-500 to-indigo-600 flex items-center justify-center text-xl sm:text-2xl shadow-xl">
                📳
              </div>
            </div>

            <p className="text-base sm:text-lg">
              Waiting for tap…
              <span className="text-gray-400 ml-2">
                ({timeLeft}s)
              </span>
            </p>

            <p className="text-3xl sm:text-4xl font-bold">
              ₹{amount}
            </p>

            <button
              onClick={cancelRequest}
              className="text-sm text-gray-400 underline"
            >
              Cancel
            </button>
          </div>
        )}

        {state === "SUCCESS" && (
          <PaymentSuccess amount={Number(amount)} onDone={reset} />
        )}

        {state === "FAILED" && (
          <PaymentFailure onRetry={reset} />
        )}

      </div>
    </div>
  );
}
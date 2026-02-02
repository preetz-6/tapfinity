"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PaymentSuccess from "../../components/PaymentSuccess";
import PaymentFailure from "../../components/PaymentFailure";

type State = "ENTER" | "WAITING" | "SUCCESS" | "FAILED";

const WAIT_SECONDS = 15;

export default function ReceivePayment() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [state, setState] = useState<State>("ENTER");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(WAIT_SECONDS);

  /* ---------------- CREATE REQUEST ---------------- */
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

  /* ---------------- COUNTDOWN ---------------- */
  useEffect(() => {
    if (state !== "WAITING") return;

    if (timeLeft <= 0) {
      setState("FAILED");
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [state, timeLeft]);

  /* ---------------- POLLING ---------------- */
  useEffect(() => {
    if (!requestId || state !== "WAITING" || timeLeft <= 0) return;

    const interval = setInterval(async () => {
      const res = await fetch(
        `/api/merchant/payment-request/${requestId}`
      );

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

  /* ---------------- RESET ---------------- */
  function reset() {
    setAmount("");
    setRequestId(null);
    setTimeLeft(WAIT_SECONDS);
    setState("ENTER");
  }
  /* ---------------- AUTO REDIRECT (3s) ---------------- */
useEffect(() => {
  if (state !== "SUCCESS") return;

  const timer = setTimeout(() => {
    reset(); 
    // OR router.push("/merchant") if you want dashboard instead
  }, 3000);

  return () => clearTimeout(timer);
}, [state]);


  /* ---------------- CANCEL ---------------- */
  async function cancelRequest() {
    if (requestId) {
      await fetch(`/api/merchant/payment-request/${requestId}`, {
        method: "DELETE",
      });
    }
    reset();
  }

  return (
    <div className="flex-1 flex items-center justify-center text-white">
      <div className="w-full max-w-md bg-gray-900 p-6 rounded-2xl">

        {/* ENTER */}
        {state === "ENTER" && (
          <div className="animate-fade-in">
            <h1 className="text-xl mb-4">Enter Amount</h1>

            <input
              type="number"
              placeholder="₹ Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-4 rounded-xl bg-gray-800 text-lg mb-4"
            />

            <button
              onClick={createRequest}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 text-lg font-semibold"
            >
              Continue
            </button>

            {error && (
              <p className="text-red-400 text-sm mt-3">{error}</p>
            )}
          </div>
        )}

        {/* WAITING */}
        {state === "WAITING" && (
          <div className="flex flex-col items-center space-y-6 animate-fade-in">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="absolute w-full h-full rounded-full bg-indigo-500/30 animate-ping" />
              <div className="absolute w-28 h-28 rounded-full bg-indigo-500/40 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-indigo-600 flex items-center justify-center text-2xl shadow-xl">
                📳
              </div>
            </div>

            <p className="text-lg">
              Waiting for tap…{" "}
              <span className="text-gray-400">({timeLeft}s)</span>
            </p>

            <p className="text-4xl font-bold">₹{amount}</p>

            <button
              onClick={cancelRequest}
              className="text-sm text-gray-400 underline"
            >
              Cancel
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {state === "SUCCESS" && (
          <PaymentSuccess
            amount={Number(amount)}
            onDone={reset}
          />
        )}

        {/* FAILED */}
        {state === "FAILED" && (
          <PaymentFailure
            onRetry={reset}
          />
        )}

      </div>
    </div>
  );
}

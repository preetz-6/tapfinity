"use client";

import { useRouter } from "next/navigation";

export default function MerchantHome() {
  const router = useRouter();

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">

        <h1 className="text-2xl text-gray-300">
          Tap to start a payment
        </h1>

        {/* Big Gradient Button */}
        <button
          onClick={() => router.push("/merchant/receive")}
          className="
            w-56 h-56 rounded-full
            flex items-center justify-center
            text-xl font-bold text-white
            bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600
            shadow-[0_0_60px_rgba(139,92,246,0.6)]
            hover:scale-105 active:scale-95
            transition-transform
          "
        >
          💳 Pay
        </button>

        <p className="text-gray-500 text-sm text-center max-w-xs">
          Enter amount and ask customer to tap their NFC card
        </p>

      </div>
    </div>
  );
}

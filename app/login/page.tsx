"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MERCHANT">("ADMIN");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const provider =
      role === "ADMIN"
        ? "admin-credentials"
        : "merchant-credentials";

    const res = await signIn(provider, {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
      return;
    }

    // role-based redirect
    router.push(role === "ADMIN" ? "/admin" : "/merchant");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0f1c] via-[#0b1226] to-[#05070f]">
      <div className="w-full max-w-md rounded-2xl bg-[#0e1629]/80 backdrop-blur-xl p-8 shadow-2xl border border-white/10">

        <h1 className="text-3xl font-semibold text-white text-center mb-2">
          Tap-Finity
        </h1>
        <p className="text-sm text-gray-400 text-center mb-8">
          Secure Login
        </p>

        {/* Role Selector */}
        <div className="flex mb-6 rounded-xl bg-[#111a30] p-1">
          <button
            type="button"
            onClick={() => setRole("ADMIN")}
            className={`flex-1 py-2 rounded-lg text-sm ${
              role === "ADMIN"
                ? "bg-blue-600 text-white"
                : "text-gray-400"
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => setRole("MERCHANT")}
            className={`flex-1 py-2 rounded-lg text-sm ${
              role === "MERCHANT"
                ? "bg-blue-600 text-white"
                : "text-gray-400"
            }`}
          >
            Merchant
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl bg-[#111a30] px-4 py-3 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl bg-[#111a30] px-4 py-3 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 text-white"
          >
            {loading
              ? "Logging in..."
              : `Log in as ${role === "ADMIN" ? "Admin" : "Merchant"}`}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Role = "ADMIN" | "MERCHANT" | "USER";

export default function Login() {
  const router = useRouter();
  const { status, data: session } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* 🔐 LOGIN PAGE GUARD */
  useEffect(() => {
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;

      if (role === "ADMIN") router.replace("/admin");
      else if (role === "MERCHANT") router.replace("/merchant");
      else if (role === "USER") router.replace("/dashboard");
      else router.replace("/");
    }
  }, [status, session, router]);

  if (status === "loading") return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const provider =
      role === "ADMIN"
        ? "admin-credentials"
        : role === "MERCHANT"
        ? "merchant-credentials"
        : "user-credentials";

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

    router.replace(
      role === "ADMIN"
        ? "/admin"
        : role === "MERCHANT"
        ? "/merchant"
        : "/dashboard"
    );
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

        {/* ROLE SELECTOR */}
        <div className="flex mb-6 rounded-xl bg-[#111a30] p-1">
          {(["USER", "ADMIN", "MERCHANT"] as Role[]).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-lg text-sm transition ${
                role === r
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl bg-[#111a30] px-4 py-3 text-white"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl bg-[#111a30] px-4 py-3 text-white"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-red-400 text-sm text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 text-white"
          >
            {loading ? "Logging in..." : `Log in as ${role}`}
          </button>
        </form>
      </div>
    </div>
  );
}

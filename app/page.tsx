import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    const role = (session.user as any)?.role;

    if (role === "ADMIN") redirect("/admin");
    if (role === "MERCHANT") redirect("/merchant");

    redirect("/login"); // safety fallback
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#040714] via-[#0b122a] to-[#020617] text-white">
      
      {/* NAVBAR */}
      <header className="flex items-center justify-between px-8 py-6">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Tap-Fin<span className="text-blue-500">ity</span>
        </h1>

        <Link
          href="/login"
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold hover:bg-blue-700 transition"
        >
          Login
        </Link>
      </header>

      {/* HERO */}
      <section className="px-8 py-28 text-center">
        <h2 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
          Smart <span className="text-blue-500">Campus</span><br />
          Payment System
        </h2>

        <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto">
          Tap-Finity is a secure NFC-based cashless payment platform built for
          colleges, hostels, cafeterias, and events — with full admin control,
          real-time tracking, and fraud-resistant design.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/login"
            className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3 text-sm font-semibold hover:opacity-90 transition"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-8 pb-28">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            title="Tap & Pay"
            desc="Instant NFC payments with atomic wallet deduction and low-latency processing."
          />
          <FeatureCard
            title="Admin Control"
            desc="Manage users, assign cards, control balances, and audit every transaction."
          />
          <FeatureCard
            title="Secure by Design"
            desc="Card-secret hashing, rate-limiting, and server-side authorization — no UID trust."
          />
        </div>
      </section>

      <footer className="text-center text-sm text-slate-400 pb-10">
        © {new Date().getFullYear()} Tap-Finity · Smart Campus Payments
      </footer>
    </main>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-7 backdrop-blur hover:border-blue-500/40 transition">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-slate-300 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

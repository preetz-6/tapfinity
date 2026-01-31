/*"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      const role = (session.user as any)?.role;

      if (role === "ADMIN") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [status, session, router]);

  // Prevent flicker
  if (status === "loading") return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#05070f] via-[#0b1226] to-[#0a0f1c] text-white">
      
      {* NAVBAR *}
      <header className="flex items-center justify-between px-6 py-5">
        <h1 className="text-xl font-semibold tracking-wide">
          Tap-Finity
        </h1>

        <Link
          href="/login"
          className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2 text-sm font-medium hover:opacity-90 transition"
        >
          Login
        </Link>
      </header>

      {/* HERO *}
      <section className="px-6 py-24 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-5">
          Smart Campus Payments
        </h2>

        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Tap-Finity is a secure RFID-based cashless payment system designed
          for campuses, hostels, and cafeterias with real-time admin control
          and transaction tracking.
        </p>
      </section>

      {/* FEATURES *}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <FeatureCard
            title="Tap & Pay"
            desc="Instant RFID-based payments with live balance updates and low latency."
          />

          <FeatureCard
            title="Admin Control"
            desc="Manage users, assign RFID cards, top-up wallets, and audit transactions."
          />

          <FeatureCard
            title="Secure & Scalable"
            desc="Built using Next.js, FastAPI, MQTT, Prisma, and PostgreSQL."
          />
        </div>
      </section>

      <footer className="text-center text-sm text-slate-400 pb-8">
        © {new Date().getFullYear()} Tap-Finity · Secure Campus Payments
      </footer>
    </main>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur hover:border-blue-500/40 transition">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-slate-300 text-sm">{desc}</p>
    </div>
  );
}
  */

import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    const role = (session.user as any)?.role;

    if (role === "ADMIN") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#05070f] via-[#0b1226] to-[#0a0f1c] text-white">
      
      {/* NAVBAR */}
      <header className="flex items-center justify-between px-6 py-5">
        <h1 className="text-xl font-semibold tracking-wide">
          Tap-Finity
        </h1>

        <Link
          href="/login"
          className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2 text-sm font-medium hover:opacity-90 transition"
        >
          Login
        </Link>
      </header>

      {/* HERO */}
      <section className="px-6 py-24 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-5">
          Smart Campus Payments
        </h2>

        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Tap-Finity is a secure RFID-based cashless payment system designed
          for campuses, hostels, and cafeterias with real-time admin control
          and transaction tracking.
        </p>
      </section>

      {/* FEATURES */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            title="Tap & Pay"
            desc="Instant RFID-based payments with live balance updates and low latency."
          />
          <FeatureCard
            title="Admin Control"
            desc="Manage users, assign RFID cards, top-up wallets, and audit transactions."
          />
          <FeatureCard
            title="Secure & Scalable"
            desc="Built using Next.js, FastAPI, MQTT, Prisma, and PostgreSQL."
          />
        </div>
      </section>

      <footer className="text-center text-sm text-slate-400 pb-8">
        © {new Date().getFullYear()} Tap-Finity · Secure Campus Payments
      </footer>
    </main>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur hover:border-blue-500/40 transition">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-slate-300 text-sm">{desc}</p>
    </div>
  );
}


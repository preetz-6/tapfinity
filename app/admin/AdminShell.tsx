"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();

  const [mobileOpen, setMobileOpen] = useState(false);

  // 🔐 CLIENT-SIDE AUTH GUARD
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading") return null;

  const linkClass = (href: string) =>
    `block rounded-lg px-4 py-2 transition ${
      pathname === href
        ? "bg-blue-600 text-white"
        : "text-gray-300 hover:bg-white/10"
    }`;

  return (
    <div className="flex min-h-screen bg-[#05070f] text-white">

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed lg:static z-50
          w-64 h-full
          bg-[#0b1226] p-4 flex flex-col
          transform transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="mb-6 border-b border-white/10 pb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Admin Dashboard</h2>

          {/* CLOSE BUTTON (mobile only) */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-gray-400"
          >
            ✕
          </button>
        </div>

        <nav className="space-y-2">
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={linkClass("/admin")}
          >
            Activity Monitor
          </Link>

          <Link
            href="/admin/users"
            onClick={() => setMobileOpen(false)}
            className={linkClass("/admin/users")}
          >
            Users
          </Link>

          <Link
            href="/admin/merchants"
            onClick={() => setMobileOpen(false)}
            className={linkClass("/admin/merchants")}
          >
            Merchants
          </Link>

          <Link
            href="/admin/transactions"
            onClick={() => setMobileOpen(false)}
            className={linkClass("/admin/transactions")}
          >
            Transactions
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <button
            onClick={() =>
              signOut({
                callbackUrl: "/",
                redirect: true,
              })
            }
            className="w-full rounded-lg px-4 py-2 text-left text-red-400 hover:bg-white/10 transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col">

        {/* MOBILE TOP BAR */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0b1226] border-b border-white/10">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-white text-xl"
          >
            ☰
          </button>
          <h1 className="font-semibold">Admin</h1>
        </div>

        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
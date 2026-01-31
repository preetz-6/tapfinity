"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const linkClass = (href: string) =>
    `block rounded-lg px-4 py-2 ${
      pathname === href
        ? "bg-blue-600 text-white"
        : "text-gray-300 hover:bg-white/10"
    }`;

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-[#0b1226] p-4 flex flex-col">
        {/* HEADER */}
        <div className="mb-6 border-b border-white/10 pb-4">
          <h2 className="text-lg font-semibold">Admin Dashboard</h2>
        </div>

        <nav className="space-y-2">
          <Link href="/admin" className={linkClass("/admin")}>
            Activity Monitor
          </Link>
          <Link href="/admin/users" className={linkClass("/admin/users")}>
            Users
          </Link>
          <Link href="/admin/transactions" className={linkClass("/admin/transactions")}>
            Transactions
          </Link>
        </nav>

        {/* FOOTER */}
        <div className="mt-auto pt-6 border-t border-white/10">
          <button
            onClick={async () => {
              await signOut({ redirect: false });
              router.push("/login");
            }}
            className="w-full rounded-lg px-4 py-2 text-left text-red-400 hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 bg-[#05070f] text-white">{children}</main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function UserSidebar({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `block rounded-lg px-4 py-2 ${
      pathname === href
        ? "bg-orange-600 text-white"
        : "text-orange-200 hover:bg-orange-500/20"
    }`;

  return (
    <aside className="w-64 bg-[#1a120b] p-4 flex flex-col">
      <h2 className="text-xl font-semibold mb-6 text-orange-400">
        My Wallet
      </h2>

      <nav className="space-y-2">
        <Link href="/dashboard" className={linkClass("/dashboard")}>
          Dashboard
        </Link>
        <Link
          href="/dashboard/topup"
          className={linkClass("/dashboard/topup")}
        >
          Top-up Wallet
        </Link>
        <Link
          href="/dashboard/history"
          className={linkClass("/dashboard/history")}
        >
          Transactions
        </Link>
        <Link
          href="/dashboard/card"
          className={linkClass("/dashboard/card")}
        >
          Card Status
        </Link>
      </nav>

      <div className="mt-auto pt-6 border-t border-orange-500/20">
        <button
          onClick={onLogout}
          className="w-full text-left text-red-400 hover:bg-white/10 px-4 py-2 rounded-lg"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

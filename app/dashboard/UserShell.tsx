"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import UserSidebar from "./components/UserSidebar";

export default function UserShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }

    if (status === "authenticated") {
const role = session?.user?.role;
;
      if (role !== "USER") {
        router.replace("/");
      }
    }
  }, [status, session, router]);

  if (status === "loading") return null;

  return (
    <div className="flex min-h-screen bg-[#0f0f0f] text-white">
      <UserSidebar
        onLogout={() =>
          signOut({ callbackUrl: "/", redirect: true })
        }
      />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

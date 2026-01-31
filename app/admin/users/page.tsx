"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import PinModal from "@/app/components/PinModal";

/* ===================== TYPES ===================== */
type User = {
  id: string;
  name: string | null;
  email: string;
  rfidUid: string | null;
  balance: number;
  status: "ACTIVE" | "BLOCKED";
};

/* ===================== COMPONENT ===================== */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [showRfidModal, setShowRfidModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [rfidInput, setRfidInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  const [pendingAction, setPendingAction] = useState<null | { payload: any }>(
    null
  );

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(
      u =>
        u.name?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.rfidUid?.toLowerCase().includes(q)
    );
  }, [users, search]);

  if (loading) return <p>Loading users…</p>;

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium"
        >
          + Create User
        </button>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search by name, email, or RFID"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 w-full max-w-sm rounded-lg bg-black/30 border border-white/10 p-2 text-sm"
      />

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">RFID</th>
              <th className="p-3 text-left">Balance</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id} className="border-t border-white/10">
                <td className="p-3">{u.name ?? "-"}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.rfidUid ?? "-"}</td>
                <td className="p-3">₹ {u.balance}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      u.status === "ACTIVE"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  <ActionButton
                    label="RFID"
                    color="blue"
                    onClick={() => {
                      setSelectedUser(u);
                      setRfidInput(u.rfidUid ?? "");
                      setShowRfidModal(true);
                    }}
                  />
                  <ActionButton
                    label={u.status === "ACTIVE" ? "Block" : "Unblock"}
                    color="yellow"
                    onClick={() => {
                      setPendingAction({
                        payload: {
                          userId: u.id,
                          status:
                            u.status === "ACTIVE" ? "BLOCKED" : "ACTIVE",
                        },
                      });
                      setPinOpen(true);
                    }}
                  />
                  <ActionButton
                    label="Top-up"
                    color="green"
                    disabled={u.status !== "ACTIVE"}
                    onClick={() => {
                      setSelectedUser(u);
                      setAmountInput("");
                      setShowTopupModal(true);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PIN MODAL */}
      <PinModal
        open={pinOpen}
        loading={pinLoading}
        error={pinError}
        onClose={() => {
          setPinOpen(false);
          setPendingAction(null);
          setPinError("");
        }}
        onSubmit={async pin => {
          if (!pendingAction) return;
          setPinLoading(true);

          const res = await fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...pendingAction.payload, pin }),
          });

          const data = await res.json();
          setPinLoading(false);

          if (!res.ok) {
            setPinError(data.error || "Invalid PIN");
            return;
          }

          setPinOpen(false);
          setPendingAction(null);
          fetchUsers();
        }}
      />
    </div>
  );
}

/* ===================== BUTTON ===================== */
function ActionButton({
  label,
  color,
  onClick,
  disabled,
}: {
  label: string;
  color: "blue" | "yellow" | "green";
  onClick: () => void;
  disabled?: boolean;
}) {
  const colors = {
    blue: "bg-blue-600",
    yellow: "bg-yellow-500 text-black",
    green: "bg-green-600",
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md px-3 py-1 text-xs font-medium ${
        disabled ? "opacity-40 cursor-not-allowed" : colors[color]
      }`}
    >
      {label}
    </button>
  );
}

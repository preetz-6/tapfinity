"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PinModal from "@/app/components/PinModal";
import CreateUserModal from "./CreateUserModal";
import TopUpModal from "./TopUpModal";
import ProvisionCardModal from "./ProvisionCardModal";

/* ===================== TYPES ===================== */
type User = {
  id: string;
  name: string | null;
  email: string;
  balance: number;
  status: "ACTIVE" | "BLOCKED";
  cardSecretHash: string | null;
};

type PinAction = "CARD" | "BLOCK";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [cardUser, setCardUser] = useState<User | null>(null);
  const [cardPin, setCardPin] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);

  const [pinOpen, setPinOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinAction, setPinAction] = useState<PinAction | null>(null);

  /* ---------------- FETCH USERS ---------------- */
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* ---------------- SEARCH ---------------- */
  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(
      u =>
        u.name?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
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
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm"
        >
          + Create User
        </button>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search by name or email"
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
                  {/* CARD */}
                  <ActionButton
                    label="Card"
                    color="blue"
                    onClick={() => {
                      setSelectedUser(u);
                      setPinAction("CARD");
                      setPinOpen(true);
                    }}
                  />

                  {/* BLOCK / UNBLOCK */}
                  <ActionButton
                    label={u.status === "ACTIVE" ? "Block" : "Unblock"}
                    color="yellow"
                    onClick={() => {
                      setSelectedUser(u);
                      setPinAction("BLOCK");
                      setPinOpen(true);
                    }}
                  />

                  {/* TOP-UP */}
                  <ActionButton
                    label="Top-up"
                    color="green"
                    disabled={u.status !== "ACTIVE"}
                    onClick={() => {
                      setSelectedUser(u);
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
          setSelectedUser(null);
          setPinAction(null);
          setPinError("");
        }}
        onSubmit={async pin => {
          if (!selectedUser || !pinAction) return;

          setPinLoading(true);

          if (pinAction === "BLOCK") {
            await fetch("/api/admin/users", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: selectedUser.id,
                status:
                  selectedUser.status === "ACTIVE"
                    ? "BLOCKED"
                    : "ACTIVE",
                pin,
              }),
            });

            setPinLoading(false);
            setPinOpen(false);
            setPinAction(null);
            setSelectedUser(null);
            fetchUsers();
            return;
          }

          // CARD FLOW (unchanged)
          setPinLoading(false);
          setPinOpen(false);
          setPinAction(null);
          setCardUser(selectedUser);
          setCardPin(pin);
        }}
      />

      {/* PROVISION CARD */}
      {cardUser && (
        <ProvisionCardModal
          open
          user={{
            id: cardUser.id,
            email: cardUser.email,
            hasCard: !!cardUser.cardSecretHash,
          }}
          pin={cardPin}
          onClose={() => {
            setCardUser(null);
            setCardPin("");
            fetchUsers();
          }}
        />
      )}

      {/* CREATE USER */}
      <CreateUserModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchUsers}
      />

      {/* TOP-UP */}
      {selectedUser && (
        <TopUpModal
          open={showTopupModal}
          userId={selectedUser.id}
          onClose={() => setShowTopupModal(false)}
          onSuccess={fetchUsers}
        />
      )}
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

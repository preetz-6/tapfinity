"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#4ade80", "#60a5fa"];

/* ===================== TYPES ===================== */

type UserKpis = {
  total: number;
  active: number;
  blocked: number;
  totalBalance: number;
};

type MerchantKpis = {
  total: number;
  active: number;
  blocked: number;
};

type TxByDay = {
  day: string;
  count: number;
};

type TxTypeSplit = {
  type: string;
  _count: {
    _all: number;
  };
};

type RecentTransaction = {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  user?: {
    email?: string;
  };
};

type RecentAdminAction = {
  id: string;
  actionType: string;
  targetIdentifier: string;
  admin?: {
    name?: string;
  };
};

type DashboardData = {
  kpis: {
    users: UserKpis;
    merchants: MerchantKpis;
  };
  txByDay: TxByDay[];
  txTypeSplit: TxTypeSplit[];
  recentTransactions: RecentTransaction[];
  recentActions: RecentAdminAction[];
};

/* ===================== COMPONENT ===================== */

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((d: DashboardData) => {
        if (active) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading || !data) {
    return <p className="p-4">Loading dashboard…</p>;
  }

  const {
    kpis: { users, merchants },
    txByDay,
    txTypeSplit,
    recentTransactions,
    recentActions,
  } = data;

  return (
    <div className="space-y-10">
      {/* ================= USER KPIs ================= */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Users</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Kpi title="Total Users" value={users.total} />
          <Kpi title="Active Users" value={users.active} />
          <Kpi title="Blocked Users" value={users.blocked} />
          <Kpi
            title="Total Balance"
            value={`₹ ${users.totalBalance}`}
          />
        </div>
      </div>

      {/* ================= MERCHANT KPIs ================= */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Merchants</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Kpi title="Total Merchants" value={merchants.total} />
          <Kpi title="Active Merchants" value={merchants.active} />
          <Kpi title="Blocked Merchants" value={merchants.blocked} />
        </div>
      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LINE CHART */}
        <div className="rounded-xl border border-white/10 p-4">
          <h3 className="mb-4 font-semibold">
            Transactions (Last 7 Days)
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={txByDay}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#60a5fa"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* PIE CHART */}
        <div className="rounded-xl border border-white/10 p-4">
          <h3 className="mb-4 font-semibold">Transaction Split</h3>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={txTypeSplit}
                dataKey="_count._all"
                nameKey="type"
                outerRadius={90}
                label
              >
                {txTypeSplit.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================= RECENT ACTIVITY ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RECENT TRANSACTIONS */}
        <div className="rounded-xl border border-white/10 p-4">
          <h3 className="mb-4 font-semibold">
            Recent Transactions
          </h3>

          <table className="w-full text-sm">
            <thead className="text-gray-400">
              <tr>
                <th className="text-left">User</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-white/10"
                >
                  <td>{t.user?.email ?? "-"}</td>
                  <td
                    className={
                      t.type === "CREDIT"
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {t.type}
                  </td>
                  <td>₹ {t.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RECENT ADMIN ACTIONS */}
        <div className="rounded-xl border border-white/10 p-4">
          <h3 className="mb-4 font-semibold">
            Recent Admin Actions
          </h3>

          <ul className="space-y-2 text-sm">
            {recentActions.map((a) => (
              <li
                key={a.id}
                className="border-b border-white/10 pb-2"
              >
                <span className="font-medium">
                  {a.admin?.name ?? "Admin"}
                </span>{" "}
                {a.actionType} → {a.targetIdentifier}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ===================== KPI CARD ===================== */

function Kpi({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

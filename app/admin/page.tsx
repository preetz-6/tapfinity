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


export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading dashboard…</p>;

  const { kpis, txByDay, txTypeSplit, recentTransactions, recentActions } =
    data;

  return (
    <div className="space-y-8">
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi title="Total Users" value={kpis.totalUsers} />
        <Kpi title="Active Users" value={kpis.activeUsers} />
        <Kpi title="Blocked Users" value={kpis.blockedUsers} />
        <Kpi title="Total Balance" value={`₹ ${kpis.totalBalance}`} />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LINE CHART */}
        <div className="rounded-xl border border-white/10 p-4">
          <h3 className="mb-4 font-semibold">Transactions (Last 7 Days)</h3>
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
                {txTypeSplit.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RECENT TRANSACTIONS */}
        <div className="rounded-xl border border-white/10 p-4">
          <h3 className="mb-4 font-semibold">Recent Transactions</h3>
          <table className="w-full text-sm">
            <thead className="text-gray-400">
              <tr>
                <th className="text-left">User</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((t: any) => (
                <tr key={t.id} className="border-t border-white/10">
                  <td>{t.user?.email}</td>
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
          <h3 className="mb-4 font-semibold">Recent Admin Actions</h3>
          <ul className="space-y-2 text-sm">
            {recentActions.map((a: any) => (
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

function Kpi({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

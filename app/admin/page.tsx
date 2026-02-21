"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  AreaChart,
  Area,
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
  user?: { email?: string };
};

type RecentAdminAction = {
  id: string;
  actionType: string;
  targetIdentifier: string;
  admin?: { name?: string };
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

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");

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
      .catch(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  if (loading || !data) {
    return <p className="p-6 text-gray-400">Loading dashboard…</p>;
  }

  const {
    kpis: { users, merchants },
    txByDay,
    txTypeSplit,
    recentTransactions,
    recentActions,
  } = data;

  /* ================= EXPORT HANDLERS ================= */

  function downloadLast7Days() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);

    const url = `/api/admin/export?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
    window.open(url, "_blank");
  }

  function downloadFiltered() {
    if (!startDate || !endDate) {
      alert("Start date and end date required");
      return;
    }

    const params = new URLSearchParams({
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    });

    if (merchantId) params.append("merchantId", merchantId);
    if (userId) params.append("userId", userId);
    if (status) params.append("status", status);

    window.open(`/api/admin/export?${params.toString()}`, "_blank");
  }

  return (
    <div className="space-y-12">

      {/* ================= KPI SECTION ================= */}
      <div>
        <h2 className="text-xl font-bold mb-6">Users</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Kpi title="Total Users" value={users.total} color="blue" />
          <Kpi title="Active Users" value={users.active} color="green" />
          <Kpi title="Blocked Users" value={users.blocked} color="red" />
          <Kpi title="Total Balance" value={`₹ ${users.totalBalance}`} color="purple" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-6">Merchants</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Kpi title="Total Merchants" value={merchants.total} color="blue" />
          <Kpi title="Active Merchants" value={merchants.active} color="green" />
          <Kpi title="Blocked Merchants" value={merchants.blocked} color="red" />
        </div>
      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* AREA CHART */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/10">
          <h3 className="mb-6 text-lg font-semibold">Transactions Trend</h3>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={txByDay}>
              <defs>
                <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#60a5fa"
                fillOpacity={1}
                fill="url(#colorTx)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* DONUT CHART */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/10">
          <h3 className="mb-6 text-lg font-semibold">Transaction Split</h3>

          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={txTypeSplit}
                dataKey="_count._all"
                nameKey="type"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={5}
              >
                {txTypeSplit.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================= EXPORT SECTION ================= */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-pink-500/10 rounded-2xl p-8 border border-white/10 space-y-6">
        <h3 className="text-xl font-bold">Audit & Transaction Export</h3>

        <button
          onClick={downloadLast7Days}
          className="bg-gradient-to-r from-green-400 to-emerald-600 px-6 py-3 rounded-xl font-semibold shadow-lg hover:scale-105 transition transform"
        >
          🚀 Download Last 7 Days
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-white/10 backdrop-blur-lg border border-white/10 p-3 rounded-xl"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-white/10 backdrop-blur-lg border border-white/10 p-3 rounded-xl"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-white/10 backdrop-blur-lg border border-white/10 p-3 rounded-xl"
          >
            <option value="">All Status</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Merchant ID (optional)"
            value={merchantId}
            onChange={(e) => setMerchantId(e.target.value)}
            className="bg-white/10 backdrop-blur-lg border border-white/10 p-3 rounded-xl"
          />
          <input
            placeholder="User ID (optional)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="bg-white/10 backdrop-blur-lg border border-white/10 p-3 rounded-xl"
          />
        </div>

        <button
          onClick={downloadFiltered}
          className="bg-gradient-to-r from-blue-500 to-indigo-700 px-6 py-3 rounded-xl font-semibold shadow-lg hover:scale-105 transition transform"
        >
          📊 Download Filtered Report
        </button>
      </div>

    </div>
  );
}

/* ===================== KPI CARD ===================== */

function Kpi({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: "blue" | "green" | "red" | "purple";
}) {
  const colorMap: Record<string, string> = {
    blue: "from-blue-500 to-indigo-600",
    green: "from-green-400 to-emerald-600",
    red: "from-red-400 to-rose-600",
    purple: "from-purple-500 to-indigo-700",
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} p-6 rounded-2xl shadow-xl hover:scale-105 transition transform`}>
      <p className="text-sm opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
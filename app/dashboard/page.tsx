"use client";

import { useEffect, useState } from "react";

type TransactionEvent = {
  type: "transaction";
  device_id: string;
  uid: string;
  amount: number;
  status: "success" | "failed";
};

export default function Dashboard() {
  const [events, setEvents] = useState<TransactionEvent[]>([]);

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws");

    ws.onmessage = (event) => {
      const data: TransactionEvent = JSON.parse(event.data);
      console.log("WS event:", data);
      setEvents((prev) => [data, ...prev]);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    return () => ws.close();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Live Transactions</h1>

      {events.map((e, i) => (
        <pre
          key={i}
          style={{ background: "#111", color: "#0f0", padding: 10 }}
        >
          {JSON.stringify(e, null, 2)}
        </pre>
      ))}
    </div>
  );
}

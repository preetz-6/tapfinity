import UserShell from "../UserShell";

export default function TopupPage() {
  return (
    <UserShell>
      <h1 className="text-2xl font-semibold mb-6">
        Top-up Wallet
      </h1>

      <div className="max-w-md rounded-xl bg-white/5 p-6 border border-white/10">
        <p className="text-sm text-gray-400 mb-4">
          Select an amount
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[100, 200, 500].map(a => (
            <button
              key={a}
              className="rounded-lg bg-orange-600 py-2"
            >
              ₹ {a}
            </button>
          ))}
        </div>

        <button
          disabled
          className="w-full rounded-xl bg-gray-600 py-3 cursor-not-allowed"
        >
          UPI Top-up (Coming Soon)
        </button>
      </div>
    </UserShell>
  );
}

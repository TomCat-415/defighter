export default function HomePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Welcome to DeFighter</h2>
      <p className="opacity-80">
        Connect your wallet, create your archetype (Shitposter / Builder / VC), and battle on-chain.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-slate-800 p-4">Shitposter</div>
        <div className="rounded-lg bg-slate-800 p-4">Builder</div>
        <div className="rounded-lg bg-slate-800 p-4">VC</div>
      </div>
    </div>
  );
}



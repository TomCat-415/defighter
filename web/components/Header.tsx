"use client";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function Header() {
  return (
    <header className="flex items-center justify-between py-4">
      <h1 className="text-xl font-semibold">DeFighter</h1>
      <div className="flex items-center gap-3">
        <span className="text-xs opacity-70">RPC: {process.env.NEXT_PUBLIC_RPC_URL || "local"}</span>
        <WalletMultiButton className="btn" />
      </div>
    </header>
  );
}



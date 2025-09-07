"use client";
import { useConnection, useWallet, ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { getProgramId } from "@/lib/program";

export default function ProfilePage() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [status, setStatus] = useState<string>("Connect wallet");

  useEffect(() => {
    if (!publicKey) setStatus("Connect wallet");
    else setStatus("Coming soon: fetch/create player and upgrades");
  }, [publicKey]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Profile</h2>
      <div className="rounded bg-slate-800 p-4">
        <div>Program: {getProgramId().toBase58()}</div>
        <div>Authority: {publicKey?.toBase58() || "—"}</div>
      </div>
      <p className="opacity-80">{status}</p>
    </div>
  );
}



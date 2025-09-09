// web/app/providers.tsx (or wherever yours lives)
"use client";

import { ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

const DEFAULT_RPC = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8899";

export function Providers({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => (typeof window !== "undefined" ? [] : []), []);
  return (
    <ConnectionProvider endpoint={DEFAULT_RPC}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
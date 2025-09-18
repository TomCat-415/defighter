"use client";

import { ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { createConnectionWithTimeouts } from "@/lib/connection";

import "@solana/wallet-adapter-react-ui/styles.css";

export function AppWalletProvider({ children }: { children: ReactNode }) {
  const fallbackEndpoint = clusterApiUrl(WalletAdapterNetwork.Devnet);
  const endpoint = (process.env.NEXT_PUBLIC_SOLANA_RPC_URL as string) || fallbackEndpoint;
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  // Normalize endpoint for SSR safety
  const normalizedEndpoint = useMemo(() => {
    if (endpoint.startsWith('/')) {
      if (typeof window !== 'undefined') return `${window.location.origin}${endpoint}`;
      return 'https://api.devnet.solana.com'; // SSR fallback, replaced on client
    }
    return endpoint;
  }, [endpoint]);

  // Create connection with extended timeouts
  const connection = useMemo(() => {
    return createConnectionWithTimeouts(normalizedEndpoint);
  }, [normalizedEndpoint]);

  // Optional WebSocket endpoint (env-gated, for silencing logs only)
  const wsEndpoint = useMemo(() => {
    const fromEnv = process.env.NEXT_PUBLIC_SOLANA_WS_URL as string | undefined;
    return fromEnv && fromEnv.length > 0 ? fromEnv : undefined;
  }, []);

  // Health check with normalized endpoint
  useMemo(() => {
    if (typeof window !== 'undefined') {
      connection.getVersion().catch(() => {
        console.warn('RPC health check failed for:', normalizedEndpoint);
      });
    }
  }, [connection, normalizedEndpoint]);

  return (
    <ConnectionProvider
      endpoint={normalizedEndpoint}
      config={{
        commitment: "confirmed",
        ...(wsEndpoint ? { wsEndpoint } : {}),
        confirmTransactionInitialTimeout: 180000 // 3 minutes
      }}
    >
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}



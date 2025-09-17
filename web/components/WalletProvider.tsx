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

  // Provide WebSocket endpoint to avoid ws://localhost issues
  const wsEndpoint = useMemo(() => {
    try {
      const url = new URL(normalizedEndpoint);
      const sameOrigin = typeof window !== 'undefined' && url.origin === window.location.origin;
      if (sameOrigin) return 'wss://api.devnet.solana.com';
      const wsProto = url.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProto}//${url.host}${url.pathname}`;
    } catch {
      return 'wss://api.devnet.solana.com';
    }
  }, [normalizedEndpoint]);

  // Health check with normalized endpoint
  useMemo(() => {
    if (typeof window !== 'undefined') {
      const testConnection = new Connection(normalizedEndpoint, 'confirmed');
      testConnection.getVersion().catch(() => {
        console.warn('RPC health check failed for:', normalizedEndpoint);
      });
    }
  }, [normalizedEndpoint]);

  return (
    <ConnectionProvider 
      endpoint={normalizedEndpoint} 
      config={{ 
        commitment: "confirmed", 
        wsEndpoint 
      }}
    >
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}



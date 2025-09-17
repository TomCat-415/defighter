"use client";
import dynamic from "next/dynamic";
import Link from "next/link";

// Render wallet button client-side only to avoid SSR hydration mismatch
const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export function Header() {
  return (
    <header className="flex items-center justify-between py-4">
      <div className="flex items-center gap-6">
        <Link href="/">
          <h1 className="text-xl font-semibold hover:text-indigo-400 transition-colors cursor-pointer">
            DeFighter
          </h1>
        </Link>
        <nav className="flex items-center gap-4">
          <Link 
            href="/profile" 
            className="text-sm hover:text-indigo-400 transition-colors"
          >
            Profile
          </Link>
          <Link 
            href="/battle" 
            className="text-sm hover:text-indigo-400 transition-colors"
          >
            Battle
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs opacity-70">
          RPC: {
            process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.includes('/api/solana') ? 'Secure Proxy' :
            process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.includes('helius') ? 'Helius Devnet' :
            process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.includes('devnet.solana.com') ? 'Public Devnet' :
            process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.includes('localhost') ? 'Localhost' :
            'Devnet'
          }
        </span>
        <WalletMultiButton className="btn" />
      </div>
    </header>
  );
}



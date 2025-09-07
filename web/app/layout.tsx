import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "../components/Providers";
import { Header } from "../components/Header";

export const metadata = {
  title: "DeFighter",
  description: "On-chain PvP on Solana",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100">
        <Providers>
          <div className="max-w-6xl mx-auto p-4">
            <Header />
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}



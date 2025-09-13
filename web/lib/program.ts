"use client";

import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

import type { Defighter } from "@/target_types_proxy";           // generated types
import rawIdl from "../../target/idl/defighter.json";            // ✅ correct relative path

export function getProgram(connection: Connection, wallet: any): Program<Defighter> {
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  // 2-arg constructor for your Anchor version
  return new Program(rawIdl as unknown as Idl, provider) as unknown as Program<Defighter>;
}

export function getProgramId(): PublicKey {
  const addr = (rawIdl as any).address ?? (rawIdl as any).metadata?.address;
  if (!addr) {
    throw new Error("Program ID missing in target/idl/defighter.json — run `anchor build`.");
  }
  return new PublicKey(addr as string);
}
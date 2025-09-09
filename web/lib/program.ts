"use client";
import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

// Typed IDL type (methods, accounts, args)
import type { Defighter } from "../target_types_proxy";

// Runtime IDL object (address, instructions)
import idl from "../idl/defighter.json";

export function getProgramId(): PublicKey {
  const addr = (idl as any).address ?? (idl as any).metadata?.address;
  if (!addr) throw new Error("Program ID missing in IDL. Rebuild/copy your IDL.");
  return new PublicKey(addr);
}

export function getProgram(connection: Connection, wallet: any) {
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  return new Program<Defighter>(idl as Idl, provider); // 2-arg, typed
}

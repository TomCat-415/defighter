"use client";
import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../idl/defighter.json";
import type { Defighter } from "../target_types_proxy";

// optional helper if you need the ID anywhere else
export function getProgramId(): PublicKey {
  const addr = (idl as any).address ?? (idl as any).metadata?.address;
  if (!addr) {
    throw new Error("Program ID missing in IDL. Rebuild/copy your IDL.");
  }
  return new PublicKey(addr);
}

export function getProgram(connection: Connection, wallet: any) {
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  // two-arg form: idl + provider (programId is taken from idl.address/metadata.address)
  return new Program<Defighter>(idl as Idl, provider);
}

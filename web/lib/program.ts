"use client";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../target_idl_proxy";
import type { Defighter } from "../target_types_proxy";

export function getProgram(connection: Connection, wallet: any) {
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const programId = new PublicKey((idl as any).address || (idl as any).metadata?.address);
  return new Program<Defighter>(idl as any, provider);
}

export function getProgramId(): PublicKey {
  return new PublicKey(((idl as any).address || (idl as any).metadata?.address) as string);
}



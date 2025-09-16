"use client";

import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

import type { Defighter } from "@/target_types_proxy";   // your generated types
import idl from "@/idl/defighter.json";                  // <-- vendored IDL (web/idl/defighter.json)

function getProvider(connection: Connection, wallet: any) {
  return new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    skipPreflight: false,
    preflightCommitment: "confirmed"
  });
}

/**
 * Resolve Program ID from the IDL (preferred) or env fallback.
 * Set NEXT_PUBLIC_PROGRAM_ID if your IDL lacks metadata.address.
 */
export function getProgramId(): PublicKey {
  const addr =
    // some IDLs put it here:
    (idl as any)?.metadata?.address ||
    // older format:
    (idl as any)?.address ||
    // fallback for local/dev:
    process.env.NEXT_PUBLIC_PROGRAM_ID;

  if (!addr) {
    throw new Error(
      "Program ID missing. Ensure idl/defighter.json has metadata.address or set NEXT_PUBLIC_PROGRAM_ID."
    );
  }

  return new PublicKey(String(addr));
}

/**
 * Instantiate the Anchor Program using the vendored IDL.
 * Uses the 2-arg constructor (IDL contains the programId).
 */
export function getProgram(
  connection: Connection,
  wallet: any
): Program<Defighter> {
  const provider = getProvider(connection, wallet);
  // If your Anchor version requires explicit programId, use:
  // return new Program(idl as Idl, getProgramId(), provider) as Program<Defighter>;
  return new Program(idl as Idl, provider) as unknown as Program<Defighter>;
}
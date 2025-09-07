// client/ts/src/sdk.ts
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey, Commitment } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { keccak_256 } from "@noble/hashes/sha3";

// IDL + generated types from `anchor build`
import idl from "../../../target/idl/defighter.json";
import { Defighter } from "../../../target/types/defighter";

// --- Program ID from IDL (handles both new and old formats) ---
const IDL_ADDRESS =
  (idl as any).address ?? (idl as any).metadata?.address;
if (!IDL_ADDRESS) throw new Error("IDL missing address. Run `anchor build`.");
export const PROGRAM_ID = new PublicKey(IDL_ADDRESS);

// ---------- Provider / Program ----------
export function getProgramFromEnv(
  commitment: Commitment = "confirmed"
): Program<Defighter> {
  const base = AnchorProvider.env();
  const provider = new AnchorProvider(base.connection, base.wallet as Wallet, { commitment });
  return new Program<Defighter>(idl as any, provider); // programId comes from idl.address
}

export function getProgram(
  connection: Connection,
  wallet: Wallet,
  commitment: Commitment = "confirmed"
): Program<Defighter> {
  const provider = new AnchorProvider(connection, wallet, { commitment });
  return new Program<Defighter>(idl as any, provider); // programId comes from idl.address
}

// ---------- PDA helpers ----------
export function playerPda(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("player"), authority.toBuffer()],
    PROGRAM_ID
  );
}

export function battlePda(
  challenger: PublicKey,
  opponent: PublicKey,
  nonce: BN
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("battle"), challenger.toBuffer(), opponent.toBuffer(), toLeBytes8(nonce)],
    PROGRAM_ID
  );
}

export function configPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

// ---------- Utils ----------
export function toLeBytes8(n: BN): Buffer {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(n.toString()));
  return b;
}

/** Commit–reveal hash: [ move(1) | salt(32) | player(32) | battle(32) ] */
export function commitmentHash(
  moveByte: number,
  salt32: Uint8Array,
  player: PublicKey,
  battle: PublicKey
): Uint8Array {
  if (salt32.length !== 32) throw new Error("salt must be 32 bytes");
  const data = new Uint8Array(1 + 32 + 32 + 32);
  data[0] = moveByte & 0xff;
  data.set(salt32, 1);
  data.set(player.toBytes(), 33);
  data.set(battle.toBytes(), 65);
  return keccak_256(data);
}

export function randomSalt32(): Uint8Array {
  const b = new Uint8Array(32);
  // Node 18+ has global crypto; for older Node: import { randomBytes } from "crypto"
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(b);
  } else {
    const { randomBytes } = require("crypto");
    b.set(randomBytes(32));
  }
  return b;
}
import { PublicKey } from "@solana/web3.js";
import { keccak_256 } from "@noble/hashes/sha3";

export function randomSalt32(): Uint8Array {
  const b = new Uint8Array(32);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(b);
  } else {
    const { randomBytes } = require("crypto");
    b.set(randomBytes(32));
  }
  return b;
}

export function commitmentHash(moveByte: number, salt32: Uint8Array, player: PublicKey, battle: PublicKey): Uint8Array {
  if (salt32.length !== 32) throw new Error("salt must be 32 bytes");
  const data = new Uint8Array(1 + 32 + 32 + 32);
  data[0] = moveByte & 0xff;
  data.set(salt32, 1);
  data.set(player.toBytes(), 33);
  data.set(battle.toBytes(), 65);
  return keccak_256(data);
}



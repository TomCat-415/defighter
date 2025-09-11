import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getProgramId } from "./program";

export function playerPda(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("player"), authority.toBuffer()],
    getProgramId()
  );
}

export function battlePda(challenger: PublicKey, opponent: PublicKey, nonce: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("battle"), challenger.toBuffer(), opponent.toBuffer(), toLeBytes8(nonce)],
    getProgramId()
  );
}

export function configPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], getProgramId());
}

export function customizationPda(player: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("character_custom"), player.toBuffer()],
    getProgramId()
  );
}

export function toLeBytes8(n: BN): Buffer {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(n.toString()));
  return b;
}



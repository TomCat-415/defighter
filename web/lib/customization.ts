import { PublicKey, SystemProgram } from "@solana/web3.js";
import type { Program } from "@coral-xyz/anchor";

// Local draft persistence (per authority)
const KEY_PREFIX = "cust:v1:";

export type UICustomizationDraft = {
  genderName: "male" | "female" | "nonbinary";
  paletteName: string;
  skinToneHex: string;
  flags: { mustache?: boolean; lipstick?: boolean; glasses?: boolean };
};

export function saveCustomizationDraft(authority: PublicKey, draft: UICustomizationDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_PREFIX + authority.toBase58(), JSON.stringify(draft));
  } catch {}
}

export function loadCustomizationDraft(authority: PublicKey): UICustomizationDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + authority.toBase58());
    return raw ? (JSON.parse(raw) as UICustomizationDraft) : null;
  } catch {
    return null;
  }
}

export function hasCustomizationMethods(program: any): boolean {
  try {
    return !!program?.methods?.createCharacterCustomization && !!program?.methods?.updateCharacterCustomization;
  } catch {
    return false;
  }
}

// Placeholder: when IDL includes customization, this helper can be extended to send txs
export async function createOrUpdateCustomization(
  program: any,
  playerPda: PublicKey,
  authority: PublicKey,
  data: any
) {
  if (!hasCustomizationMethods(program)) {
    throw new Error("Customization instructions not found in IDL. Rebuild and sync IDL.");
  }
  const [custPda] = (await import("@/lib/pdas")).customizationPda(playerPda);
  // Try update first; fall back to create
  try {
    return await program.methods
      .updateCharacterCustomization(data)
      .accounts({ player: playerPda, characterCustomization: custPda, authority } as any)
      .rpc();
  } catch {
    return await program.methods
      .createCharacterCustomization(data)
      .accounts({ player: playerPda, characterCustomization: custPda, authority, systemProgram: SystemProgram.programId } as any)
      .rpc();
  }
}



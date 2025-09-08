import { Keypair } from "@solana/web3.js";

const BOT_KEYPAIR_KEY = "defighter-bot-keypair";

export function loadOrCreateBotKeypair(): Keypair {
  try {
    const stored = localStorage.getItem(BOT_KEYPAIR_KEY);
    if (stored) {
      const secretKey = new Uint8Array(JSON.parse(stored));
      console.log("Loaded existing bot keypair from localStorage");
      return Keypair.fromSecretKey(secretKey);
    }
  } catch (e) {
    console.log("Failed to load bot keypair, creating new one:", e);
  }
  
  const keypair = Keypair.generate();
  try {
    localStorage.setItem(BOT_KEYPAIR_KEY, JSON.stringify(Array.from(keypair.secretKey)));
    console.log("Saved new bot keypair to localStorage");
  } catch (e) {
    console.log("Warning: Failed to save bot keypair:", e);
  }
  return keypair;
}
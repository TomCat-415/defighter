"use client";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
} from "@solana/web3.js";
import { useState } from "react";
import { getProgram } from "@/lib/program";
import { playerPda, battlePda, configPda } from "@/lib/pdas";
import { randomSalt32, commitmentHash } from "@/lib/commitment";
import { loadOrCreateBotKeypair } from "@/lib/bot-storage";

/** View model with camelCase keys for the UI */
type BattleView = {
  pubkey: string;
  challenger: string;
  opponent: string;
  hpChallenger: number;
  hpOpponent: number;
  winner?: string | null;
  state?: string;
};

function toBattleView(battlePubkey: PublicKey, b: any): BattleView {
  const toStr = (x: any) => (x?.toBase58?.() ? x.toBase58() : String(x ?? ""));
  const toNum = (x: any) => {
    if (x == null) return 0;
    if (typeof x === "number") return x;
    if (typeof x === "bigint") return Number(x);
    if (typeof x === "string") return Number(x);
    if (typeof x?.toNumber === "function") return x.toNumber();       // BN
    if (typeof x?.toString === "function") return Number(x.toString());
    return Number(x);
  };

  // Accept BOTH snake_case and camelCase from Anchor/account fetch
  const hpChallengerRaw = b?.challenger_hp ?? b?.challengerHp ?? 0;
  const hpOpponentRaw   = b?.opponent_hp   ?? b?.opponentHp   ?? 0;

  // State pretty-print
  let state: string | undefined;
  if (b?.state && typeof b.state === "object") {
    state = Object.keys(b.state)[0];
  }

  return {
    pubkey: battlePubkey.toBase58(),
    challenger: toStr(b?.challenger),
    opponent: toStr(b?.opponent),
    hpChallenger: toNum(hpChallengerRaw),
    hpOpponent: toNum(hpOpponentRaw),
    winner: b?.winner ? toStr(b.winner) : null,
    state,
  };
}

export default function BattlePage() {
  const { connection } = useConnection();
  const { publicKey, wallet } = useWallet();
  const [log, setLog] = useState<string[]>([]);
  const [airdropping, setAirdropping] = useState<boolean>(false);

  async function logTransactionCost(
    pk: PublicKey,
    operation: string,
    txPromise: Promise<string>
  ): Promise<string> {
    const balanceBefore = await connection.getBalance(pk);
    const beforeSol = balanceBefore / LAMPORTS_PER_SOL;
    setLog((l) => [`[${operation}] Balance before: ${beforeSol.toFixed(6)} SOL`, ...l]);

    const txSig = await txPromise;

    const balanceAfter = await connection.getBalance(pk);
    const afterSol = balanceAfter / LAMPORTS_PER_SOL;
    const costSol = (balanceBefore - balanceAfter) / LAMPORTS_PER_SOL;

    setLog((l) => [
      `[${operation}] Cost: ${costSol.toFixed(6)} SOL (${afterSol.toFixed(6)} SOL remaining)`,
      ...l,
    ]);

    return txSig;
  }

  async function ensureFunds(
    pk: PublicKey,
    minSol: number,
    program?: any,
    payer?: PublicKey
  ) {
    const needLamports = Math.max(0, Math.floor(minSol * LAMPORTS_PER_SOL));
    const bal = await connection.getBalance(pk);
    if (bal >= needLamports) return;

    try {
      const sig = await connection.requestAirdrop(pk, needLamports - bal);
      await connection.confirmTransaction(sig, "confirmed");
      setLog((l) => ["Airdropped to " + pk.toBase58(), ...l]);
      return;
    } catch (e: any) {
      if (!program || !payer) throw e;
      const lamports = needLamports - bal;
      const tx = new Transaction().add(
        SystemProgram.transfer({ fromPubkey: payer, toPubkey: pk, lamports })
      );
      // @ts-ignore Anchor provider on the program
      const provider = program.provider;
      await provider.sendAndConfirm(tx, []);
      setLog((l) => [
        `Funded ${pk.toBase58()} with ${lamports / LAMPORTS_PER_SOL} SOL from payer`,
        ...l,
      ]);
    }
  }

  async function runDemo() {
    if (!connection || !publicKey || !wallet) {
      setLog((l) => ["Error: Wallet not connected", ...l]);
      return;
    }

    try {
      setLog((l) => ["Starting battle demo...", ...l]);

      const program = getProgram(connection, wallet.adapter as any);
      const me = publicKey;

      // --- Config init (once) ---
      const [cfg] = configPda();
      const cfgInfo = await connection.getAccountInfo(cfg);
      if (!cfgInfo) {
        await logTransactionCost(
          me,
          "Init Config",
          program.methods
            .initConfig(
              10,
              2,
              20,
              10,
              100,
              true,
              false,
              new BN(10),
              7500,
              2000,
              new BN(10),
              14000,
              20,
              10
            )
            .accounts({ config: cfg, admin: me, systemProgram: SystemProgram.programId } as any)
            .rpc()
        );
        setLog((l) => ["Config initialized", ...l]);
      }

      // --- Ensure players exist/funded ---
      const [pdaA] = playerPda(me);
      const bot = loadOrCreateBotKeypair();
      const [pdaB] = playerPda(bot.publicKey);

      await ensureFunds(me, 2, program, me);
      await ensureFunds(bot.publicKey, 2, program, me);

      if (!(await connection.getAccountInfo(pdaA))) {
        await logTransactionCost(
          me,
          "Create Player A",
          program.methods
            .createPlayer({ shitposter: {} })
            .accounts({ player: pdaA, authority: me, systemProgram: SystemProgram.programId } as any)
            .rpc()
        );
        setLog((l) => ["Created player A", ...l]);
      }

      if (!(await connection.getAccountInfo(pdaB))) {
        // Multi-signer (bot + Phantom) path
        const ix = await program.methods
          .createPlayer({ builder: {} })
          .accounts({
            player: pdaB,
            authority: bot.publicKey,
            systemProgram: SystemProgram.programId,
          } as any)
          .instruction();

        const tx = new Transaction().add(ix);
        tx.feePayer = me;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        tx.partialSign(bot);

        // Phantom signs fee-payer side
        // @ts-ignore
        const phantom = (window as any).phantom?.solana;
        const balBefore = await connection.getBalance(me);
        const signed = await phantom.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(sig, "confirmed");
        const balAfter = await connection.getBalance(me);

        setLog((l) => [
          `[Create Player B] Cost: ${((balBefore - balAfter) / LAMPORTS_PER_SOL).toFixed(6)} SOL`,
          `[Create Player B] TX: ${sig}`,
          ...l,
        ]);
      }

      // Baseline XP (optional)
      const accA0 = (await connection.getAccountInfo(pdaA))
        ? ((await program.account.player.fetch(pdaA)) as any)
        : null;
      const accB0 = (await connection.getAccountInfo(pdaB))
        ? ((await program.account.player.fetch(pdaB)) as any)
        : null;

      // --- Battle lifecycle ---
      const nonce = new BN(Date.now() + Math.floor(Math.random() * 1_000_000));
      const [battle] = battlePda(me, bot.publicKey, nonce);

      // Initiate (single-signer)
      {
        const ix = await program.methods
          .initiateBattle(bot.publicKey, nonce, new BN(50), new BN(50))
          .accounts({
            battle,
            challenger: me,
            systemProgram: SystemProgram.programId,
            clock: new PublicKey("SysvarC1ock11111111111111111111111111111111"),
          } as any)
          .instruction();

        const tx = new Transaction().add(ix);
        tx.feePayer = me;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        // @ts-ignore
        const phantom = (window as any).phantom?.solana;
        const balBefore = await connection.getBalance(me);
        const signed = await phantom.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(sig, "confirmed");
        const balAfter = await connection.getBalance(me);

        setLog((l) => [
          `[Initiate Battle] Cost: ${((balBefore - balAfter) / LAMPORTS_PER_SOL).toFixed(6)} SOL`,
          `[Initiate Battle] TX: ${sig}`,
          ...l,
        ]);
        setLog((l) => ["Battle initiated", ...l]);
      }

      const saltA = randomSalt32();
      const saltB = randomSalt32();
      const moveA = 0; // MemeBomb
      const moveB = 2; // ShipIt
      const hashA = commitmentHash(moveA, saltA, me, battle);
      const hashB = commitmentHash(moveB, saltB, bot.publicKey, battle);

      // Commit A (single-signer)
      {
        const ix = await program.methods
          .commitMove([...hashA] as any)
          .accounts({
            battle,
            player: me,
            clock: new PublicKey("SysvarC1ock11111111111111111111111111111111"),
          } as any)
          .instruction();

        const tx = new Transaction().add(ix);
        tx.feePayer = me;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        // @ts-ignore
        const phantom = (window as any).phantom?.solana;
        const balBefore = await connection.getBalance(me);
        const signed = await phantom.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(sig, "confirmed");
        const balAfter = await connection.getBalance(me);

        setLog((l) => [
          `[Commit Move A] Cost: ${((balBefore - balAfter) / LAMPORTS_PER_SOL).toFixed(6)} SOL`,
          `[Commit Move A] TX: ${sig}`,
          ...l,
        ]);
      }

      // Commit B (multi-signer)
      {
        const ix = await program.methods
          .commitMove([...hashB] as any)
          .accounts({
            battle,
            player: bot.publicKey,
            clock: new PublicKey("SysvarC1ock11111111111111111111111111111111"),
          } as any)
          .instruction();

        const tx = new Transaction().add(ix);
        tx.feePayer = me;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        tx.partialSign(bot);

        // @ts-ignore
        const phantom = (window as any).phantom?.solana;
        const balBefore = await connection.getBalance(me);
        const signed = await phantom.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(sig, "confirmed");
        const balAfter = await connection.getBalance(me);

        setLog((l) => [
          `[Commit Move B] Cost: ${((balBefore - balAfter) / LAMPORTS_PER_SOL).toFixed(6)} SOL`,
          `[Commit Move B] TX: ${sig}`,
          ...l,
        ]);
        setLog((l) => ["Moves committed", ...l]);
      }

      // Reveal A (single-signer)
      {
        const ix = await program.methods
          .revealMove({ memeBomb: {} } as any, [...saltA] as any)
          .accounts({
            battle,
            player: me,
            playerAccount: pdaA,
            clock: new PublicKey("SysvarC1ock11111111111111111111111111111111"),
          } as any)
          .instruction();

        const tx = new Transaction().add(ix);
        tx.feePayer = me;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        // @ts-ignore
        const phantom = (window as any).phantom?.solana;
        const balBefore = await connection.getBalance(me);
        const signed = await phantom.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(sig, "confirmed");
        const balAfter = await connection.getBalance(me);

        setLog((l) => [
          `[Reveal Move A] Cost: ${((balBefore - balAfter) / LAMPORTS_PER_SOL).toFixed(6)} SOL`,
          `[Reveal Move A] TX: ${sig}`,
          ...l,
        ]);
      }

      // Reveal B (multi-signer)
      {
        const ix = await program.methods
          .revealMove({ shipIt: {} } as any, [...saltB] as any)
          .accounts({
            battle,
            player: bot.publicKey,
            playerAccount: pdaB,
            clock: new PublicKey("SysvarC1ock11111111111111111111111111111111"),
          } as any)
          .instruction();

        const tx = new Transaction().add(ix);
        tx.feePayer = me;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        tx.partialSign(bot);

        // @ts-ignore
        const phantom = (window as any).phantom?.solana;
        const balBefore = await connection.getBalance(me);
        const signed = await phantom.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(sig, "confirmed");
        const balAfter = await connection.getBalance(me);

        setLog((l) => [
          `[Reveal Move B] Cost: ${((balBefore - balAfter) / LAMPORTS_PER_SOL).toFixed(6)} SOL`,
          `[Reveal Move B] TX: ${sig}`,
          ...l,
        ]);
        setLog((l) => ["Moves revealed", ...l]);
      }

      // Resolve (single-signer via Anchor .rpc is fine)
      await logTransactionCost(
        me,
        "Resolve Battle",
        program.methods
          .resolveBattle()
          .accounts({
            battle,
            playerChallenger: pdaA,
            playerOpponent: pdaB,
            config: cfg,
            clock: new PublicKey("SysvarC1ock11111111111111111111111111111111"),
          } as any)
          .rpc()
      );
      setLog((l) => ["Battle resolved", ...l]);

      // --- Post-battle summary (real HP from chain) ---
      try {
        // small delay helps avoid RPC race where the last write isn't visible yet
        await new Promise((r) => setTimeout(r, 300));

        const bAccRaw = (await program.account.battle.fetch(battle)) as any;

        // Deep debug to see what fields you actually have
        console.log("raw keys:", Object.keys(bAccRaw));
        console.log(
          "hp fields (snake/camel):",
          (bAccRaw as any).challenger_hp,
          (bAccRaw as any).opponent_hp,
          (bAccRaw as any).challengerHp,
          (bAccRaw as any).opponentHp
        );

        const view = toBattleView(battle, bAccRaw);

        // Players for XP summary (optional)
        const accA1 = (await program.account.player.fetch(pdaA)) as any;
        const accB1 = (await program.account.player.fetch(pdaB)) as any;
        const toBig = (v: any) => BigInt(v?.toString?.() ?? v ?? 0);
        const xpA0 = accA0 ? toBig(accA0.xp) : 0n;
        const xpB0 = accB0 ? toBig(accB0.xp) : 0n;
        const xpA1 = toBig(accA1.xp);
        const xpB1 = toBig(accB1.xp);
        const dA = xpA1 - xpA0;
        const dB = xpB1 - xpB0;

        setLog((l) => [
          `🏆 Winner: ${view.winner ?? "<none>"} (state: ${view.state ?? "unknown"})`,
          `💀 Final HP - A: ${view.hpChallenger}/200 | B: ${view.hpOpponent}/200`,
          `📦 Battle: ${view.pubkey}`,
          `👤 A: ${view.challenger}`,
          `🤖 B: ${view.opponent}`,
          `📊 XP - A: ${xpA0.toString()} → ${xpA1.toString()} (+${dA.toString()}) | B: ${xpB0.toString()} → ${xpB1.toString()} (+${dB.toString()})`,
          ...l,
        ]);
        console.log("Battle account (raw):", bAccRaw);
        console.log("Battle view (normalized):", view);
      } catch {
        // ignore summary errors
      }
    } catch (error: any) {
      console.error("Battle demo failed:", error);
      setLog((l) => [
        `Demo failed: ${error.message || error.toString()}`,
        `Error type: ${error.name || "Unknown"}`,
        "Check console for details",
        ...l,
      ]);
    }
  }

  async function airdropSelf(amountSol = 2) {
    if (!connection || !publicKey) return;
    setAirdropping(true);
    try {
      const sig = await connection.requestAirdrop(
        publicKey,
        amountSol * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(sig, "confirmed");
      setLog((l) => [
        `Airdropped ${amountSol} SOL to ${publicKey.toBase58()}`,
        ...l,
      ]);
    } catch (e: any) {
      setLog((l) => [
        `Airdrop failed (${e?.message || e}). Use faucet: https://faucet.solana.com/devnet`,
        ...l,
      ]);
    } finally {
      setAirdropping(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Battle Demo</h2>
      <button
        className="rounded bg-indigo-600 px-4 py-2"
        onClick={runDemo}
        disabled={!publicKey}
      >
        {publicKey ? "Run Demo Battle" : "Connect wallet first"}
      </button>
      <button
        className="rounded bg-slate-700 px-4 py-2 ml-3"
        onClick={() => airdropSelf(2)}
        disabled={!publicKey || airdropping}
      >
        {airdropping ? "Airdropping…" : "Airdrop 2 SOL"}
      </button>
      <div className="space-y-1">
        {log.map((l, i) => (
          <div key={i} className="text-sm opacity-80">
            • {l}
          </div>
        ))}
      </div>
    </div>
  );
}

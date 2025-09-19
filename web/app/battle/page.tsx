"use client";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  ComputeBudgetProgram,
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

  function formatSol(lamports: number): string {
    return (lamports / LAMPORTS_PER_SOL).toFixed(6);
  }

  async function waitForBalanceAtLeast(
    pk: PublicKey,
    minLamports: number,
    timeoutMs = 90000,
    pollMs = 750
  ): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const bal = await connection.getBalance(pk);
      if (bal >= minLamports) return true;
      await new Promise((r) => setTimeout(r, pollMs));
    }
    return false;
  }

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

  async function confirmSignatureWithHttp(
    signature: string,
    timeoutMs = 180000,
    pollMs = 1000
  ): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const res = await connection.getSignatureStatuses([signature], {
        searchTransactionHistory: true,
      });
      const st = res?.value?.[0] || null;
      if (st) {
        if (st.err) throw new Error(`Transaction failed: ${JSON.stringify(st.err)}`);
        const cs = st.confirmationStatus;
        if (cs === "confirmed" || cs === "finalized") return;
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }
    throw new Error(
      `TransactionExpiredTimeoutError: Transaction was not confirmed in ${(timeoutMs / 1000).toFixed(
        2
      )} seconds.`
    );
  }

  // Batch sign (if supported) and send transactions sequentially with HTTP confirms
  async function signAndSendBatch(
    transactions: Transaction[],
    labels: string[],
    feePayer: PublicKey
  ): Promise<string[]> {
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    for (const tx of transactions) {
      tx.feePayer = feePayer;
      tx.recentBlockhash = blockhash;
    }

    const adapter: any = (wallet as any)?.adapter;
    let signed: Transaction[] = [];
    try {
      if (adapter?.signAllTransactions) {
        signed = await adapter.signAllTransactions(transactions);
      } else {
        signed = [];
        for (const tx of transactions) {
          try {
            signed.push(await adapter.signTransaction(tx));
          } catch (e: any) {
            console.error('WalletSignTransactionError:', e?.message || e);
            console.error('cause:', (e as any)?.cause || (e as any)?.originalError);
            console.log('adapter name:', adapter?.name);
            console.log('supported versions:', adapter?.supportedTransactionVersions);
            throw e;
          }
        }
      }
    } catch (e: any) {
      console.error('Batch sign failed:', e?.message || e);
      console.error('adapter name:', adapter?.name);
      throw e;
    }

    const signatures: string[] = [];
    for (let i = 0; i < signed.length; i++) {
      const before = await connection.getBalance(feePayer);
      const sig = await connection.sendRawTransaction(signed[i].serialize());
      await confirmSignatureWithHttp(sig);
      const after = await connection.getBalance(feePayer);
      setLog((l) => [
        `[${labels[i]}] Cost: ${(((before - after) / LAMPORTS_PER_SOL)).toFixed(6)} SOL`,
        `[${labels[i]}] TX: ${sig}`,
        ...l,
      ]);
      signatures.push(sig);
      await new Promise((r) => setTimeout(r, 250));
    }

    return signatures;
  }

  async function ensureFunds(
    pk: PublicKey,
    minSol: number,
    program?: any,
    payer?: PublicKey
  ) {
    const targetLamports = Math.max(0, Math.floor(minSol * LAMPORTS_PER_SOL));
    const current = await connection.getBalance(pk);
    if (current >= targetLamports) return;

    const shortfall = targetLamports - current;
    // 1) Try airdrop first
    try {
      const sig = await connection.requestAirdrop(pk, shortfall);
      setLog((l) => [
        `Airdrop requested +${formatSol(shortfall)} SOL → ${pk.toBase58()} (sig: ${sig})`,
        ...l,
      ]);
      await confirmSignatureWithHttp(sig);
      const ok = await waitForBalanceAtLeast(pk, targetLamports);
      if (ok) {
        const newBal = await connection.getBalance(pk);
        setLog((l) => [
          `Airdrop success. Balance: ${formatSol(newBal)} SOL`,
          ...l,
        ]);
        return;
      }
    } catch (e: any) {
      // fall through to manual funding
      setLog((l) => [
        `Airdrop failed (${e?.message || e}). Considering manual funding...`,
        ...l,
      ]);
    }

    // 2) Optional manual funding (explicit confirmation)
    if (!program || !payer) {
      throw new Error("Insufficient funds and no payer available for funding.");
    }
    const confirm = typeof window !== "undefined"
      ? window.confirm(
          `Airdrop failed. Send ${formatSol(shortfall)} SOL from your wallet to fund ${pk.toBase58()}?`
        )
      : false;
    if (!confirm) {
      throw new Error("User declined manual funding.");
    }

    const tx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5_000 }),
      SystemProgram.transfer({ fromPubkey: payer, toPubkey: pk, lamports: shortfall })
    );
    tx.feePayer = payer;
    const sig = await sendTransactionWithRetry(tx);
    await confirmSignatureWithHttp(sig);
    const after = await connection.getBalance(pk);
    setLog((l) => [
      `Manual funding transfer +${formatSol(shortfall)} SOL → ${pk.toBase58()} (Balance: ${formatSol(after)} SOL)`,
      ...l,
    ]);
  }

  // Helper function to send transaction with blockhash retry
  async function sendTransactionWithRetry(tx: Transaction, maxRetries = 3): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Get fresh blockhash for each attempt
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = blockhash;
        
        const adapter: any = (wallet as any)?.adapter;
        // Optional Wallet Standard sign-in (no-op for Phantom/Solflare)
        try {
          // Omit signIn() for Brave/Standard paths; not required for Phantom and may error
          if (typeof adapter?.connect === 'function' && !adapter.connected) {
            await adapter.connect();
          }
        } catch (e) {
          console.warn('Wallet sign-in/connect skipped or failed:', e);
        }

        let signed: Transaction;
        try {
          signed = await adapter.signTransaction(tx);
        } catch (e: any) {
          console.error('WalletSignTransactionError:', e?.message || e);
          console.error('cause:', (e as any)?.cause || (e as any)?.originalError);
          console.log('adapter name:', adapter?.name);
          console.log('supported versions:', adapter?.supportedTransactionVersions);
          throw e;
        }
        
        // Small delay to ensure blockhash is still valid
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return await connection.sendRawTransaction(signed.serialize());
      } catch (error: any) {
        if (error.message?.includes('Blockhash not found') && attempt < maxRetries) {
          setLog((l) => [`Retry ${attempt}/${maxRetries} due to blockhash error`, ...l]);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
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
          (async () => {
            const ix = await program.methods
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
              .instruction();
            const tx = new Transaction().add(
              ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
              ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5_000 }),
              ix
            );
            tx.feePayer = me;
            const sig = await sendTransactionWithRetry(tx);
            await confirmSignatureWithHttp(sig);
            return sig;
          })()
        );
        setLog((l) => ["Config initialized", ...l]);
        // Wait for blockhash to update
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // --- Ensure players exist/funded ---
      const [pdaA] = playerPda(me);
      const bot = loadOrCreateBotKeypair();
      const [pdaB] = playerPda(bot.publicKey);

      // Balance gate only (no auto-airdrop/transfer). Require small minimum to proceed.
      const minUserLamports = Math.floor(0.02 * LAMPORTS_PER_SOL);
      const userBal = await connection.getBalance(me);
      if (userBal < minUserLamports) {
        setLog((l) => [
          `Insufficient SOL: need ≥ 0.02 SOL to run demo. Use the Faucet/Airdrop button, then retry.`,
          ...l,
        ]);
        return;
      }

      const needCreateA = !(await connection.getAccountInfo(pdaA));

      if (!(await connection.getAccountInfo(pdaB))) {
        // Multi-signer (bot + Phantom) path
        const ix = await program.methods
          .createPlayer({ builder: {} })
          .accounts({
            player: pdaB,
            authority: bot.publicKey,
            payer: me,
            systemProgram: SystemProgram.programId,
          } as any)
          .instruction();

        const tx = new Transaction().add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5_000 }),
          ix
        );
        tx.feePayer = me;
        const { blockhash: blockhashCreateB } = await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = blockhashCreateB;
        // Pre-simulate to surface real errors early
        try {
          const sim = await connection.simulateTransaction(tx);
          if (sim.value.err) {
            console.error('Sim err (Create B):', sim.value.err);
            console.error('Logs:', sim.value.logs);
            throw new Error('Simulation failed for Create Player B');
          }
        } catch (e) {
          console.warn('Simulation warning (Create B):', e);
        }
        // Refresh blockhash right before user signs
        const { blockhash: bhFinalCreateB } = await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = bhFinalCreateB;
        const adapter: any = (wallet as any)?.adapter;
        let sig: string;
        const balBefore = await connection.getBalance(me);
        try {
          if (typeof adapter?.connect === 'function' && !adapter.connected) {
            await adapter.connect();
          }
          // User signs first, then bot partial signs, then send
          let signedTx_User: Transaction = await adapter.signTransaction(tx);
          signedTx_User.partialSign(bot);
          sig = await connection.sendRawTransaction(signedTx_User.serialize());
        } catch (e: any) {
          console.warn('signTransaction failed (Create B), trying sendTransaction fallback:', e?.message || e);
          const { blockhash: bhFallback } = await connection.getLatestBlockhash('confirmed');
          tx.recentBlockhash = bhFallback;
          tx.partialSign(bot);
          sig = await (adapter as any).sendTransaction(tx, connection, { skipPreflight: false });
        }
        await confirmSignatureWithHttp(sig);
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

      // Build single-signer set for batch signing: Create Player A (if needed) and Initiate
      {
        const singleSignerTxs: Transaction[] = [];
        const labels: string[] = [];

        if (needCreateA) {
          const createAIx = await program.methods
            .createPlayer({ shitposter: {} })
            .accounts({ player: pdaA, authority: me, payer: me, systemProgram: SystemProgram.programId } as any)
            .instruction();
          const txA = new Transaction().add(
            ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5_000 }),
            createAIx
          );
          singleSignerTxs.push(txA);
          labels.push("Create Player A");
        }

        const initiateIx = await program.methods
          .initiateBattle(bot.publicKey, nonce, new BN(1500), new BN(1500))
          .accounts({
            battle,
            challenger: me,
            systemProgram: SystemProgram.programId,
            clock: new PublicKey("SysvarC1ock11111111111111111111111111111111"),
          } as any)
          .instruction();
        const txI = new Transaction().add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5_000 }),
          initiateIx
        );
        singleSignerTxs.push(txI);
        labels.push("Initiate Battle");

        await signAndSendBatch(singleSignerTxs, labels, me);
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

        const tx = new Transaction().add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5_000 }),
          ix
        );
        tx.feePayer = me;

        const balBefore = await connection.getBalance(me);
        const sig = await sendTransactionWithRetry(tx);
        await confirmSignatureWithHttp(sig);
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

        const tx = new Transaction().add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5_000 }),
          ix
        );
        tx.feePayer = me;
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = blockhash;
        // Pre-simulate to catch program errors early
        try {
          const sim = await connection.simulateTransaction(tx);
          if (sim.value.err) {
            console.error('Sim err (Commit B):', sim.value.err);
            console.error('Logs:', sim.value.logs);
            throw new Error('Simulation failed for Commit B');
          }
        } catch (e) {
          console.warn('Simulation warning (Commit B):', e);
        }
        const adapter: any = (wallet as any)?.adapter;
        // Refresh blockhash again just before user signs
        const { blockhash: bh2 } = await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = bh2;
        let sig: string;
        const balBefore = await connection.getBalance(me);
        try {
          if (typeof adapter?.connect === 'function' && !adapter.connected) {
            await adapter.connect();
          }
          let signedUser: Transaction = await adapter.signTransaction(tx);
          signedUser.partialSign(bot);
          sig = await connection.sendRawTransaction(signedUser.serialize());
        } catch (e: any) {
          console.warn('signTransaction failed (Commit B), trying sendTransaction fallback:', e?.message || e);
          const { blockhash: bh2f } = await connection.getLatestBlockhash('confirmed');
          tx.recentBlockhash = bh2f;
          tx.partialSign(bot);
          sig = await (adapter as any).sendTransaction(tx, connection, { skipPreflight: false });
        }
        await confirmSignatureWithHttp(sig);
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

        const tx = new Transaction().add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5_000 }),
          ix
        );
        tx.feePayer = me;

        const balBefore = await connection.getBalance(me);
        const sig = await sendTransactionWithRetry(tx);
        await confirmSignatureWithHttp(sig);
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
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = blockhash;
        try {
          const sim = await connection.simulateTransaction(tx);
          if (sim.value.err) {
            console.error('Sim err (Reveal B):', sim.value.err);
            console.error('Logs:', sim.value.logs);
            throw new Error('Simulation failed for Reveal B');
          }
        } catch (e) {
          console.warn('Simulation warning (Reveal B):', e);
        }
        const adapter: any = (wallet as any)?.adapter;
        const { blockhash: bh3 } = await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = bh3;
        let sig: string;
        const balBefore = await connection.getBalance(me);
        try {
          if (typeof adapter?.connect === 'function' && !adapter.connected) {
            await adapter.connect();
          }
          let signedUser2: Transaction = await adapter.signTransaction(tx);
          signedUser2.partialSign(bot);
          sig = await connection.sendRawTransaction(signedUser2.serialize());
        } catch (e: any) {
          console.warn('signTransaction failed (Reveal B), trying sendTransaction fallback:', e?.message || e);
          const { blockhash: bh3f } = await connection.getLatestBlockhash('confirmed');
          tx.recentBlockhash = bh3f;
          tx.partialSign(bot);
          sig = await (adapter as any).sendTransaction(tx, connection, { skipPreflight: false });
        }
        await confirmSignatureWithHttp(sig);
        const balAfter = await connection.getBalance(me);

        setLog((l) => [
          `[Reveal Move B] Cost: ${((balBefore - balAfter) / LAMPORTS_PER_SOL).toFixed(6)} SOL`,
          `[Reveal Move B] TX: ${sig}`,
          ...l,
        ]);
        setLog((l) => ["Moves revealed", ...l]);
      }

      // Resolve (single-signer via manual send + HTTP confirm)
      await logTransactionCost(
        me,
        "Resolve Battle",
        (async () => {
          const ix = await program.methods
            .resolveBattle()
            .accounts({
              battle,
              playerChallenger: pdaA,
              playerOpponent: pdaB,
              config: cfg,
              clock: new PublicKey("SysvarC1ock11111111111111111111111111111111"),
            } as any)
            .instruction();
          const tx = new Transaction().add(ix);
          tx.feePayer = me;
          const sig = await sendTransactionWithRetry(tx);
          await confirmSignatureWithHttp(sig);
          return sig;
        })()
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

        // Determine winner display name
        const getPlayerName = (pubkey: string | null | undefined) => {
          if (!pubkey) return "<none>";
          if (pubkey === me.toBase58()) return "You (Player A)";
          if (pubkey === bot.publicKey.toBase58()) return "Bot (Player B)";
          return pubkey; // fallback to pubkey if unknown
        };

        const winnerId: string | null = (view as { winner?: string | null })?.winner ?? null;
        const winnerName = getPlayerName(winnerId);

        setLog((l) => [
          `🏆 Winner: ${winnerName} (state: ${view.state ?? "unknown"})`,
          `💀 Final HP - You: ${view.hpChallenger}/200 | Bot: ${view.hpOpponent}/200`,
          `📦 Battle: ${view.pubkey}`,
          `👤 You: ${view.challenger}`,
          `🤖 Bot: ${view.opponent}`,
          `📊 XP - You: ${xpA0.toString()} → ${xpA1.toString()} (+${dA.toString()}) | Bot: ${xpB0.toString()} → ${xpB1.toString()} (+${dB.toString()})`,
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
      await confirmSignatureWithHttp(sig);
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

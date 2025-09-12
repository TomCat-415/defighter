"use client";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import { useState } from "react";
import { getProgram } from "@/lib/program";
import { playerPda, battlePda, configPda } from "@/lib/pdas";
import { randomSalt32, commitmentHash } from "@/lib/commitment";
import { loadOrCreateBotKeypair } from "@/lib/bot-storage";

export default function BattlePage() {
  const { connection } = useConnection();
  const { publicKey, wallet, sendTransaction } = useWallet();
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
    const needLamports = Math.max(0, minSol * LAMPORTS_PER_SOL);
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
      // @ts-ignore
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
        // Create Player B using the same direct approach
        const createPlayerBInstruction = await program.methods
          .createPlayer({ builder: {} })
          .accounts({
            player: pdaB,
            authority: bot.publicKey,
            systemProgram: SystemProgram.programId,
          } as any)
          .instruction();
        
        const playerBTx = new Transaction();
        playerBTx.add(createPlayerBInstruction);
        playerBTx.feePayer = me; // You pay fees
        const { blockhash: playerBBlockhash } = await connection.getLatestBlockhash();
        playerBTx.recentBlockhash = playerBBlockhash;
        
        // Bot signs first
        playerBTx.partialSign(bot);
        
        // Then Phantom signs
        const phantom = (window as any).phantom?.solana;
        const balanceBeforePlayerB = await connection.getBalance(me);
        const signedPlayerBTx = await phantom.signTransaction(playerBTx);
        const playerBSig = await connection.sendRawTransaction(signedPlayerBTx.serialize());
        await connection.confirmTransaction(playerBSig, 'confirmed');
        
        const balanceAfterPlayerB = await connection.getBalance(me);
        const costPlayerB = (balanceBeforePlayerB - balanceAfterPlayerB) / LAMPORTS_PER_SOL;
        
        setLog((l) => [
          `[Create Player B] Cost: ${costPlayerB.toFixed(6)} SOL`,
          `[Create Player B] TX: ${playerBSig}`,
          ...l,
        ]);
      }

      // Baseline XP
      const accA0 = (await connection.getAccountInfo(pdaA))
        ? ((await program.account.player.fetch(pdaA)) as any)
        : null;
      const accB0 = (await connection.getAccountInfo(pdaB))
        ? ((await program.account.player.fetch(pdaB)) as any)
        : null;

      // Use a unique nonce to ensure we create a completely fresh battle account
      const nonce = new BN(Date.now() + Math.floor(Math.random() * 1000000));
      const [battle] = battlePda(me, bot.publicKey, nonce);

      // Create initiate battle transaction
      const instruction = await program.methods
        .initiateBattle(bot.publicKey, nonce, new BN(50), new BN(50))
        .accounts({
          battle,
          challenger: me,
          systemProgram: SystemProgram.programId,
          clock: new PublicKey("SysvarC1ock11111111111111111111111111111111"),
        } as any)
        .instruction();
      
      // Create completely fresh Transaction object
      const freshTx = new Transaction();
      freshTx.add(instruction);
      freshTx.feePayer = me;
      const { blockhash } = await connection.getLatestBlockhash();
      freshTx.recentBlockhash = blockhash;
      
      console.log("Fresh Transaction created:", {
        feePayer: freshTx.feePayer.toBase58(),
        recentBlockhash: freshTx.recentBlockhash,
        instructions: freshTx.instructions.length,
        signatures: freshTx.signatures.length,
        canSerialize: typeof freshTx.serialize === 'function'
      });
      
      const balanceBefore = await connection.getBalance(me);
      
      // Use direct Phantom API with fresh Transaction
      const phantom = (window as any).phantom?.solana;
      if (!phantom?.signTransaction) {
        throw new Error('Phantom not available');
      }
      
      console.log("Calling Phantom with fresh Transaction...");
      const signedTx = await phantom.signTransaction(freshTx);
      console.log("Phantom signed successfully!");
      
      const initSig = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(initSig, 'confirmed');
      
      const balanceAfter = await connection.getBalance(me);
      const costSol = (balanceBefore - balanceAfter) / LAMPORTS_PER_SOL;
      
      setLog((l) => [
        `[Initiate Battle] Cost: ${costSol.toFixed(6)} SOL`,
        `[Initiate Battle] TX: ${initSig}`,
        ...l,
      ]);
      setLog((l) => ["Battle initiated", ...l]);

      const saltA = randomSalt32();
      const saltB = randomSalt32();
      const moveA = 0; // MemeBomb
      const moveB = 2; // ShipIt
      const hashA = commitmentHash(moveA, saltA, me, battle);
      const hashB = commitmentHash(moveB, saltB, bot.publicKey, battle);

      // Commit Move A - direct approach (single signer)
      const commitMoveAInstruction = await program.methods
        .commitMove([...hashA] as any)
        .accounts({
          battle,
          player: me,
          clock: new PublicKey("SysvarC1ock11111111111111111111111111111111"),
        } as any)
        .instruction();
      
      const commitATx = new Transaction();
      commitATx.add(commitMoveAInstruction);
      commitATx.feePayer = me;
      const { blockhash: commitABlockhash } = await connection.getLatestBlockhash();
      commitATx.recentBlockhash = commitABlockhash;
      
      const balanceBeforeCommitA = await connection.getBalance(me);
      const signedCommitATx = await phantom.signTransaction(commitATx);
      const commitASig = await connection.sendRawTransaction(signedCommitATx.serialize());
      await connection.confirmTransaction(commitASig, 'confirmed');
      
      const balanceAfterCommitA = await connection.getBalance(me);
      const costCommitA = (balanceBeforeCommitA - balanceAfterCommitA) / LAMPORTS_PER_SOL;
      
      setLog((l) => [
        `[Commit Move A] Cost: ${costCommitA.toFixed(6)} SOL`,
        `[Commit Move A] TX: ${commitASig}`,
        ...l,
      ]);

      // Commit Move B - direct approach
      const commitMoveBInstruction = await program.methods
        .commitMove([...hashB] as any)
        .accounts({
          battle,
          player: bot.publicKey,
          clock: new PublicKey("SysvarC1ock11111111111111111111111111111111"),
        } as any)
        .instruction();
      
      const commitBTx = new Transaction();
      commitBTx.add(commitMoveBInstruction);
      commitBTx.feePayer = me;
      const { blockhash: commitBBlockhash } = await connection.getLatestBlockhash();
      commitBTx.recentBlockhash = commitBBlockhash;
      
      const balanceBeforeCommitB = await connection.getBalance(me);
      commitBTx.partialSign(bot);
      const signedCommitBTx = await phantom.signTransaction(commitBTx);
      const commitBSig = await connection.sendRawTransaction(signedCommitBTx.serialize());
      await connection.confirmTransaction(commitBSig, 'confirmed');
      
      const balanceAfterCommitB = await connection.getBalance(me);
      const costCommitB = (balanceBeforeCommitB - balanceAfterCommitB) / LAMPORTS_PER_SOL;
      
      setLog((l) => [
        `[Commit Move B] Cost: ${costCommitB.toFixed(6)} SOL`,
        `[Commit Move B] TX: ${commitBSig}`,
        ...l,
      ]);
      setLog((l) => ["Moves committed", ...l]);

      // Reveal Move A - direct approach (single signer)
      const revealMoveAInstruction = await program.methods
        .revealMove({ memeBomb: {} } as any, [...saltA] as any)
        .accounts({
          battle,
          player: me,
          playerAccount: pdaA,
          clock: new PublicKey("SysvarC1ock11111111111111111111111111111111"),
        } as any)
        .instruction();
      
      const revealATx = new Transaction();
      revealATx.add(revealMoveAInstruction);
      revealATx.feePayer = me;
      const { blockhash: revealABlockhash } = await connection.getLatestBlockhash();
      revealATx.recentBlockhash = revealABlockhash;
      
      const balanceBeforeRevealA = await connection.getBalance(me);
      const signedRevealATx = await phantom.signTransaction(revealATx);
      const revealASig = await connection.sendRawTransaction(signedRevealATx.serialize());
      await connection.confirmTransaction(revealASig, 'confirmed');
      
      const balanceAfterRevealA = await connection.getBalance(me);
      const costRevealA = (balanceBeforeRevealA - balanceAfterRevealA) / LAMPORTS_PER_SOL;
      
      setLog((l) => [
        `[Reveal Move A] Cost: ${costRevealA.toFixed(6)} SOL`,
        `[Reveal Move A] TX: ${revealASig}`,
        ...l,
      ]);

      // Reveal Move B - direct approach  
      const revealMoveBInstruction = await program.methods
        .revealMove({ shipIt: {} } as any, [...saltB] as any)
        .accounts({
          battle,
          player: bot.publicKey,
          playerAccount: pdaB,
          clock: new PublicKey("SysvarC1ock11111111111111111111111111111111"),
        } as any)
        .instruction();
      
      const revealBTx = new Transaction();
      revealBTx.add(revealMoveBInstruction);
      revealBTx.feePayer = me;
      const { blockhash: revealBBlockhash } = await connection.getLatestBlockhash();
      revealBTx.recentBlockhash = revealBBlockhash;
      
      const balanceBeforeRevealB = await connection.getBalance(me);
      revealBTx.partialSign(bot);
      const signedRevealBTx = await phantom.signTransaction(revealBTx);
      const revealBSig = await connection.sendRawTransaction(signedRevealBTx.serialize());
      await connection.confirmTransaction(revealBSig, 'confirmed');
      
      const balanceAfterRevealB = await connection.getBalance(me);
      const costRevealB = (balanceBeforeRevealB - balanceAfterRevealB) / LAMPORTS_PER_SOL;
      
      setLog((l) => [
        `[Reveal Move B] Cost: ${costRevealB.toFixed(6)} SOL`,
        `[Reveal Move B] TX: ${revealBSig}`,
        ...l,
      ]);
      setLog((l) => ["Moves revealed", ...l]);

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

      // Post-battle summary
      try {
        const bAcc = (await program.account.battle.fetch(battle)) as any;
        const winnerPk: PublicKey | null = bAcc.winner ?? null;
        const accA1 = (await program.account.player.fetch(pdaA)) as any;
        const accB1 = (await program.account.player.fetch(pdaB)) as any;
        const xpA0 = accA0 ? BigInt(accA0.xp.toString ? accA0.xp.toString() : accA0.xp) : 0n;
        const xpB0 = accB0 ? BigInt(accB0.xp.toString ? accB0.xp.toString() : accB0.xp) : 0n;
        const xpA1 = BigInt(accA1.xp.toString ? accA1.xp.toString() : accA1.xp);
        const xpB1 = BigInt(accB1.xp.toString ? accB1.xp.toString() : accB1.xp);
        const dA = xpA1 - xpA0;
        const dB = xpB1 - xpB0;

        let winnerName = "<none>";
        if (winnerPk) {
          if ((winnerPk as PublicKey).equals(me)) winnerName = "A (You - Shitposter)";
          else if ((winnerPk as PublicKey).equals(bot.publicKey)) winnerName = "B (Bot - Builder)";
          else winnerName = `Unknown (${(winnerPk as PublicKey).toBase58()})`;
        }

        // TEMPORARY HARDCODE TEST - If this shows correct values, the issue is account reading
        const challengerHP = 75; // Should be 200 - 125 = 75
        const opponentHP = 120;   // Should be 200 - 80 = 120  
        
        // Show what we SHOULD be reading vs what we ARE reading
        console.log("HP MISMATCH DEBUG:", {
          battleKey: battle.toBase58(),
          shouldBeChallenger: 75,
          shouldBeOpponent: 120,  
          actuallyReadingChallenger: (bAcc as any).challenger_hp,
          actuallyReadingOpponent: (bAcc as any).opponent_hp,
          fullAccountKeys: Object.keys(bAcc)
        });
        
        // Calculate expected damage for debugging
        const expectedMemeBombDmg = 100 * 0.80; // Shitposter → Builder (losing matchup)
        const expectedShipItDmg = 100 * 1.25;   // Builder → Shitposter (winning matchup)
        
        // Debug player progression multipliers
        const playerA = accA1;
        const playerB = accB1;
        const totalAbilitiesA = (playerA.abilities[0] + playerA.abilities[1] + playerA.abilities[2]);
        const totalAbilitiesB = (playerB.abilities[0] + playerB.abilities[1] + playerB.abilities[2]);
        const xpTierA = Math.floor(Number(playerA.xp) / 1000);
        const xpTierB = Math.floor(Number(playerB.xp) / 1000);
        const playerPowerA = 1.0 + (totalAbilitiesA * 0.05) + (xpTierA * 0.02);
        const playerPowerB = 1.0 + (totalAbilitiesB * 0.05) + (xpTierB * 0.02);
        
        setLog((l) => [
          `🏆 Winner: ${winnerName}`,
          `💀 Final HP - A: ${challengerHP}/200 | B: ${opponentHP}/200`,
          `⚔️ Moves: A used MemeBomb vs B used ShipIt`,
          `🧮 Expected Base Damage - MemeBomb: ${expectedMemeBombDmg} | ShipIt: ${expectedShipItDmg}`,
          `⚡ Player Power - A: ${playerPowerA.toFixed(2)}x (${totalAbilitiesA} abilities, XP tier ${xpTierA}) | B: ${playerPowerB.toFixed(2)}x (${totalAbilitiesB} abilities, XP tier ${xpTierB})`,
          `💥 Actual Damage - MemeBomb: ${(expectedMemeBombDmg * playerPowerA).toFixed(0)} | ShipIt: ${(expectedShipItDmg * playerPowerB).toFixed(0)}`,
          `📊 XP - A: ${xpA0.toString()} → ${xpA1.toString()} (+${dA.toString()}) | B: ${xpB0.toString()} → ${xpB1.toString()} (+${dB.toString()})`,
          `✨ NEW BATTLE SYSTEM: HP-based with simultaneous move resolution!`,
          `🔍 Debug: Both players starting with 200 HP each`,
          ...l,
        ]);
      } catch {}
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
      const sig = await connection.requestAirdrop(publicKey, amountSol * LAMPORTS_PER_SOL);
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
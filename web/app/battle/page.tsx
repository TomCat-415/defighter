"use client";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN, Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import { useState } from "react";
import { getProgram } from "@/lib/program";
import { playerPda, battlePda, configPda } from "@/lib/pdas";
import { randomSalt32, commitmentHash } from "@/lib/commitment";

export default function BattlePage() {
  const { connection } = useConnection();
  const { publicKey, wallet } = useWallet();
  const [log, setLog] = useState<string[]>([]);
  const [airdropping, setAirdropping] = useState<boolean>(false);

  async function ensureFunds(
    pk: PublicKey,
    minSol: number,
    program?: Program,
    payer?: PublicKey
  ) {
    const needLamports = Math.max(0, minSol * LAMPORTS_PER_SOL);
    const bal = await connection.getBalance(pk);
    if (bal >= needLamports) return;
    // Try faucet first (works on localnet/devnet if not rate-limited)
    try {
      const sig = await connection.requestAirdrop(pk, needLamports - bal);
      await connection.confirmTransaction(sig, "confirmed");
      setLog((l) => ["Airdropped to " + pk.toBase58(), ...l]);
      return;
    } catch (e: any) {
      // Fallback: transfer from connected wallet (devnet 429 case)
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
    if (!connection || !publicKey || !wallet) return;
    const program = getProgram(connection, wallet.adapter as any);
    const me = publicKey;
    const [cfg] = configPda();
    const cfgInfo = await connection.getAccountInfo(cfg);
    if (!cfgInfo) {
      await program.methods
        .initConfig(10, 2, 20, 10, 100, true, false, new BN(10), 7500, 2000, new BN(10), 14000, 20, 10)
        .accounts({ config: cfg, admin: me, systemProgram: SystemProgram.programId } as any)
        .rpc();
      setLog((l) => ["Config initialized", ...l]);
    }

    const [pdaA] = playerPda(me);
    const bot = Keypair.generate();
    const [pdaB] = playerPda(bot.publicKey);
    // Ensure both authorities have SOL for account creation/fees
    await ensureFunds(me, 2, program, me);
    await ensureFunds(bot.publicKey, 2, program, me);
    if (!(await connection.getAccountInfo(pdaA))) {
      await program.methods.createPlayer({ shitposter: {} }).accounts({ player: pdaA, authority: me, systemProgram: SystemProgram.programId } as any).rpc();
      setLog((l) => ["Created player A", ...l]);
    }
    if (!(await connection.getAccountInfo(pdaB))) {
      await program.methods.createPlayer({ builder: {} }).accounts({ player: pdaB, authority: bot.publicKey, systemProgram: SystemProgram.programId } as any).signers([bot]).rpc();
      setLog((l) => ["Created player B", ...l]);
    }

    // Baseline XP
    const accA0 = await connection.getAccountInfo(pdaA)
      ? (await program.account.player.fetch(pdaA)) as any
      : null;
    const accB0 = await connection.getAccountInfo(pdaB)
      ? (await program.account.player.fetch(pdaB)) as any
      : null;

    const nonce = new BN(Date.now());
    const [battle] = battlePda(me, bot.publicKey, nonce);
    await program.methods.initiateBattle(bot.publicKey, nonce, new BN(50), new BN(50)).accounts({ battle, challenger: me, systemProgram: SystemProgram.programId, clock: (window as any).anchor?.web3?.SYSVAR_CLOCK_PUBKEY || new PublicKey("SysvarC1ock11111111111111111111111111111111") } as any).rpc();
    setLog((l) => ["Battle initiated", ...l]);

    const saltA = randomSalt32();
    const saltB = randomSalt32();
    const moveA = 0; // MemeBomb
    const moveB = 2; // ShipIt
    const hashA = commitmentHash(moveA, saltA, me, battle);
    const hashB = commitmentHash(moveB, saltB, bot.publicKey, battle);
    await program.methods.commitMove([...hashA] as any).accounts({ battle, player: me, clock: new PublicKey("SysvarC1ock11111111111111111111111111111111") } as any).rpc();
    await program.methods.commitMove([...hashB] as any).accounts({ battle, player: bot.publicKey, clock: new PublicKey("SysvarC1ock11111111111111111111111111111111") } as any).signers([bot]).rpc();
    setLog((l) => ["Moves committed", ...l]);

    await program.methods.revealMove({ memeBomb: {} } as any, [...saltA] as any).accounts({ battle, player: me, playerAccount: pdaA, clock: new PublicKey("SysvarC1ock11111111111111111111111111111111") } as any).rpc();
    await program.methods.revealMove({ shipIt: {} } as any, [...saltB] as any).accounts({ battle, player: bot.publicKey, playerAccount: pdaB, clock: new PublicKey("SysvarC1ock11111111111111111111111111111111") } as any).signers([bot]).rpc();
    setLog((l) => ["Moves revealed", ...l]);

    await program.methods.resolveBattle().accounts({ battle, playerChallenger: pdaA, playerOpponent: pdaB, config: cfg, clock: new PublicKey("SysvarC1ock11111111111111111111111111111111") } as any).rpc();
    setLog((l) => ["Battle resolved", ...l]);

    // Post-battle summary: winner + XP deltas
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
      setLog((l) => [
        `Winner: ${winnerPk ? (winnerPk as PublicKey).toBase58() : "<none>"}`,
        `XP A: ${xpA0.toString()} -> ${xpA1.toString()} (Δ ${dA.toString()})`,
        `XP B: ${xpB0.toString()} -> ${xpB1.toString()} (Δ ${dB.toString()})`,
        ...l,
      ]);
    } catch (e) {
      // ignore summary errors
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
      <button className="rounded bg-indigo-600 px-4 py-2" onClick={runDemo} disabled={!publicKey}>
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
          <div key={i} className="text-sm opacity-80">• {l}</div>
        ))}
      </div>
    </div>
  );
}



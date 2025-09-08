// client/ts/src/demo.ts
import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import {
  getProgramFromEnv,
  playerPda,
  battlePda,
  configPda,
  toLeBytes8,
  commitmentHash,
  randomSalt32,
} from "./sdk";

async function confirmAirdrop(connection: Connection, pk: PublicKey, lamports: number) {
  const sig = await connection.requestAirdrop(pk, lamports);
  await connection.confirmTransaction(sig, "confirmed");
}

async function airdropIfNeeded(connection: Connection, pk: PublicKey, minSol = 2) {
  const bal = await connection.getBalance(pk);
  if (bal < minSol * LAMPORTS_PER_SOL) {
    await confirmAirdrop(connection, pk, minSol * LAMPORTS_PER_SOL);
  }
}

const BOT_KEYPAIR_FILE = path.join(__dirname, "..", "..", "bot-keypair.json");

function loadOrCreateBotKeypair(): anchor.web3.Keypair {
  try {
    if (fs.existsSync(BOT_KEYPAIR_FILE)) {
      const data = JSON.parse(fs.readFileSync(BOT_KEYPAIR_FILE, "utf8"));
      console.log("Loaded existing bot keypair from", BOT_KEYPAIR_FILE);
      return anchor.web3.Keypair.fromSecretKey(new Uint8Array(data));
    }
  } catch (e) {
    console.log("Failed to load bot keypair, creating new one:", e);
  }
  
  const keypair = anchor.web3.Keypair.generate();
  try {
    fs.writeFileSync(BOT_KEYPAIR_FILE, JSON.stringify(Array.from(keypair.secretKey)));
    console.log("Saved new bot keypair to", BOT_KEYPAIR_FILE);
  } catch (e) {
    console.log("Warning: Failed to save bot keypair:", e);
  }
  return keypair;
}

async function logTransactionCost(
  connection: Connection, 
  pk: PublicKey, 
  operation: string, 
  txPromise: Promise<string>
): Promise<string> {
  const balanceBefore = await connection.getBalance(pk);
  const beforeSol = balanceBefore / LAMPORTS_PER_SOL;
  
  console.log(`[${operation}] Balance before: ${beforeSol.toFixed(6)} SOL`);
  
  const txSig = await txPromise;
  
  const balanceAfter = await connection.getBalance(pk);
  const afterSol = balanceAfter / LAMPORTS_PER_SOL;
  const costSol = (balanceBefore - balanceAfter) / LAMPORTS_PER_SOL;
  
  console.log(`[${operation}] Balance after: ${afterSol.toFixed(6)} SOL`);
  console.log(`[${operation}] Cost: ${costSol.toFixed(6)} SOL`);
  console.log(`[${operation}] TX: ${txSig}`);
  
  return txSig;
}

async function main() {
  // Provider via env: ANCHOR_WALLET + ANCHOR_PROVIDER_URL
  const program = getProgramFromEnv("confirmed");
  const connection = program.provider.connection;
  const me = program.provider.publicKey!;
  console.log("Wallet:", me.toBase58());

  await airdropIfNeeded(connection, me, 5);

  // 1) Init config (once)
  const [cfg] = configPda();
  if (!(await connection.getAccountInfo(cfg))) {
    // Pass numbers for i32/u16/bool; BN for u64 fields
    await logTransactionCost(connection, me, "Init Config", 
      program.methods
        .initConfig(
          10,           // base (i32)
          2,            // linear_a (i32)
          20,           // dim_k (i32)
          10,           // dim_t (i32)
          100,          // max_level (u16)
          true,         // tie_break_rand (bool)
          false,        // use_dim_bonus (bool)
          new BN(10),   // xp_base (u64)
          7500,         // xp_tie_bps (u16)
          2000,         // xp_loser_bps (u16)
          new BN(10),   // upgrade_c0 (u64)
          14000,        // upgrade_p_bps (u16)
          20,           // rps_win_base (i32)
          10,           // rps_tie_base (i32)
        )
        .accounts({
          config: cfg,
          admin: me,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc()
    );
    console.log("Config initialized:", cfg.toBase58());
  } else {
    console.log("Config already present:", cfg.toBase58());
  }

  // 2) Ensure two players exist (A = me, B = persistent bot keypair)
  const keypairB = loadOrCreateBotKeypair();
  await airdropIfNeeded(connection, keypairB.publicKey, 5);

  const [pdaA] = playerPda(me);
  const [pdaB] = playerPda(keypairB.publicKey);

  if (!(await connection.getAccountInfo(pdaA))) {
    await logTransactionCost(connection, me, "Create Player A",
      program.methods
        .createPlayer({ shitposter: {} }) // class enum variant
        .accounts({
          player: pdaA,
          authority: me,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc()
    );
    console.log("Created player A (Shitposter):", pdaA.toBase58());
  }

  if (!(await connection.getAccountInfo(pdaB))) {
    await logTransactionCost(connection, me, "Create Player B",
      program.methods
        .createPlayer({ builder: {} })
        .accounts({
          player: pdaB,
          authority: keypairB.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([keypairB])
        .rpc()
    );
    console.log("Created player B (Builder):", pdaB.toBase58());
  }

  // Clarify authorities vs PDAs
  console.log("Me (authority):", me.toBase58(), "PlayerA PDA:", pdaA.toBase58());
  console.log("Opponent (authority):", keypairB.publicKey.toBase58(), "PlayerB PDA:", pdaB.toBase58());

  // Read baseline XP before the battle
  const accA0 = (await program.account.player.fetch(pdaA)) as any;
  const accB0 = (await program.account.player.fetch(pdaB)) as any;
  const xpA0 = new BN(accA0.xp);
  const xpB0 = new BN(accB0.xp);

  // 3) Create battle
  const nonce = new BN(Date.now()); // simple unique nonce for PDA seeds
  const [battle] = battlePda(me, keypairB.publicKey, nonce);
  await logTransactionCost(connection, me, "Initiate Battle",
    program.methods
      .initiateBattle(keypairB.publicKey, nonce, new BN(50), new BN(50)) // deadlines (slots/seconds) as your program expects
      .accounts({
        battle,
        challenger: me,
        systemProgram: SystemProgram.programId,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      } as any)
      .rpc()
  );
  console.log("Battle initiated:", battle.toBase58());

  // 4) Commit moves
  // RPS mapping in your program (example):
  // Shitposter > VC, VC > Builder, Builder > Shitposter
  // Moves: MemeBomb (Shitposter) = 0, SeriesACannon (VC) = 1, ShipIt (Builder) = 2
  const moveA = 0; // MemeBomb (A is Shitposter)
  const moveB = 2; // ShipIt    (B is Builder) => Builder > Shitposter, A should lose unless upgrades/random flip it

  const saltA = randomSalt32();
  const saltB = randomSalt32();

  const hashA = commitmentHash(moveA, saltA, me, battle);
  const hashB = commitmentHash(moveB, saltB, keypairB.publicKey, battle);

  await logTransactionCost(connection, me, "Commit Move A",
    program.methods
      .commitMove([...hashA] as any)
      .accounts({ battle, player: me, clock: anchor.web3.SYSVAR_CLOCK_PUBKEY } as any)
      .rpc()
  );

  await logTransactionCost(connection, me, "Commit Move B",
    program.methods
      .commitMove([...hashB] as any)
      .accounts({ battle, player: keypairB.publicKey, clock: anchor.web3.SYSVAR_CLOCK_PUBKEY } as any)
      .signers([keypairB])
      .rpc()
  );

  console.log("Moves committed.");

  // 5) Reveal moves
  await logTransactionCost(connection, me, "Reveal Move A",
    program.methods
      .revealMove({ memeBomb: {} } as any, [...saltA] as any)
      .accounts({
        battle,
        player: me,
        playerAccount: pdaA,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      } as any)
      .rpc()
  );

  await logTransactionCost(connection, me, "Reveal Move B",
    program.methods
      .revealMove({ shipIt: {} } as any, [...saltB] as any)
      .accounts({
        battle,
        player: keypairB.publicKey,
        playerAccount: pdaB,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      } as any)
      .signers([keypairB])
      .rpc()
  );

  console.log("Moves revealed.");

  // 6) Resolve
  await logTransactionCost(connection, me, "Resolve Battle",
    program.methods
      .resolveBattle()
      .accounts({
        battle,
        playerChallenger: pdaA,
        playerOpponent: pdaB,
        config: cfg,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      } as any)
      .rpc()
  );

  // Fetch result + post-battle XP and print summary
  const battleAcc = (await program.account.battle.fetch(battle)) as any;
  const winnerPk: PublicKey | null = battleAcc.winner ?? null;
  const accA1 = (await program.account.player.fetch(pdaA)) as any;
  const accB1 = (await program.account.player.fetch(pdaB)) as any;
  const xpA1 = new BN(accA1.xp);
  const xpB1 = new BN(accB1.xp);
  const dA = xpA1.sub(xpA0);
  const dB = xpB1.sub(xpB0);

  console.log("Battle resolved:", battle.toBase58());
  
  // Winner name mapping
  let winnerName = "<none>";
  if (winnerPk) {
    if ((winnerPk as PublicKey).equals(me)) {
      winnerName = "A (You)";
    } else if ((winnerPk as PublicKey).equals(keypairB.publicKey)) {
      winnerName = "B (Bot)";
    } else {
      winnerName = `Unknown (${(winnerPk as PublicKey).toBase58()})`;
    }
  }
  console.log("Winner:", winnerName);
  
  console.log("XP A (me):", xpA0.toString(), "->", xpA1.toString(), "(Δ", dA.toString(), ")");
  console.log("XP B (opponent):", xpB0.toString(), "->", xpB1.toString(), "(Δ", dB.toString(), ")");

  // Optional: fetch and print battle account
  // const b = await program.account.battle.fetch(battle);
  // console.log("Winner:", (b as any).winner?.toBase58());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

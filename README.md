# DeFighter (SBV Edition)

On-chain PvP fighting game on Solana with Shitposter, Builder, VC archetypes. Commit–reveal fairness, u16 levels, XP, and tunable balance via Config PDA.

## Quickstart (localnet)

Prereqs: Solana CLI, Anchor CLI (0.31.x), Rust, Node 18+.

```bash
# Terminal 1: start validator
solana-test-validator --reset --quiet
```

```bash
# Terminal 2: build, deploy, run demo
export ANCHOR_PROVIDER_URL=http://127.0.0.1:8899
export ANCHOR_WALLET=$HOME/.config/solana/id.json
anchor build && anchor deploy
cd client/ts
npm i
npx ts-node src/demo.ts
```

Or one-shot:
```bash
cd client/ts
npm i
npm run local-demo
```

## Structure
- programs/defighter: Anchor program (Rust)
- client/ts: TypeScript client + demo
- docs/: design/spec

## Notes
- Program ID is generated at target/deploy/defighter-keypair.json and wired into Anchor.toml + IDL.
- Config PDA is initialized on first run by the demo.
- Change balance params by calling admin_update_config.


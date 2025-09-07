## DeFighter Web UI Plan (Next.js)

### Stack
- Next.js (App Router) + Tailwind CSS + TypeScript
- Solana Wallet Adapter (React, UI) + @solana/web3.js
- @coral-xyz/anchor client (IDL-based Program)
- Optional: zustand (light global state) + react-query (cache RPC reads)

### App structure
- `app/`
  - `layout.tsx`: Wallet + Program providers, global styles, header
  - `page.tsx`: Home/Connect + “Create Player” CTA
  - `battle/page.tsx`: Commit–reveal flow
  - `profile/page.tsx`: Player stats + upgrades
  - `admin/page.tsx`: Config read/edit (gated by `config.admin`)
- `lib/`
  - `program.ts`: build Program from IDL + RPC + wallet
  - `pdas.ts`: `playerPda`, `battlePda`, `configPda`
  - `commitment.ts`: `randomSalt32`, `commitmentHash`
  - `types/defighter.ts`: types from IDL
- `components/`
  - `WalletButton`, `ClusterBadge`, `Toaster`
  - `ClassCard`, `PlayerCard`, `UpgradeButton`
  - `BattlePanel` (CommitMove, RevealMove, ResolveResult)
  - `ConfigView`

### Key behaviors
- Program init: client-side; get program ID from IDL; RPC from `NEXT_PUBLIC_RPC_URL`.
- Wallet: Phantom/Solflare/Backpack via Wallet Adapter UI; cluster badge shows current RPC.
- Data fetching: wrap `program.account.*.fetch` in hooks; re-fetch on tx completion.
- Commit–reveal:
  - Commit: choose move (by class), auto-generate 32B salt, show commitment, submit.
  - Reveal: countdown to deadline; reveal button; verify hash.
  - Resolve: show winner pubkey (compare to authority), XP deltas; link to profile.
- Profile: authority vs Player PDA clearly displayed; class, levels, XP, ELO; upgrade with cost hint.
- Admin: read config; if wallet == admin, allow edits; otherwise read-only.
- UX: small animations (meme burst, commit rain, money bags), toasts, disabled states.

### Env/config
- `NEXT_PUBLIC_RPC_URL` default `http://127.0.0.1:8899`.
- IDL from `target/idl/defighter.json`; verify IDL `address` matches deployed program.
- Show banner if mismatch or program not found on RPC.

### Milestones
1. Scaffold + Wallet + Program (IDL) + Tailwind + header (program ID/RPC).
2. Profile: fetch/create player; show stats; upgrade.
3. Battle: challenge, commit, reveal, resolve; show winner + XP deltas.
4. Admin view (read-only), basic animations, toasts.
5. Stretch: Leaderboard, admin config editor (gated), react-query cache.

### Risks and mitigations
- RPC mismatch: show current RPC and program ID in header; warning banner on failure.
- Validator conflicts: link to README troubleshooting (ports, envs); one-shot script.
- Address confusion: always display authority vs PDA side-by-side (we do in demo; repeat in UI).



## DeFighter (SBV Edition) — Technical Spec

This document defines the on-chain PvP fighting game using crypto archetypes: Shitposter, Builder, VC Chad (SBV). It covers accounts, PDAs, instructions, state machines, formulas, events, and security. A DNY variant (DeFi Degen/NFT Ape/Yield Farmer) can be layered as a future season using the same framework.

### High-level
- **Classes**: Shitposter, Builder, VC Chad
- **Abilities**: per-class 2 moves used during battle
  - Shitposter: MemeBomb, CopypastaStorm
  - Builder: ShipIt, TestnetDeploy
  - VC Chad: SeriesACannon, DueDiligenceDelay
- **Core loop**: commit–reveal of moves, RPS class advantage, ability bonuses from levels, XP/ELO updates
- **Scalability**: store only levels; derive power from formulas; all tunables in a Config PDA; levels use `u16`, XP `u64`

### PDAs and Seeds
- `Player` PDA: seeds `[b"player", authority_pubkey]`
- `Battle` PDA: seeds `[b"battle", challenger_pubkey, opponent_pubkey, nonce_u64_le]`
- `BalanceConfig` PDA: seeds `[b"config"]`

### Accounts
Player
```
authority: Pubkey                // owner/signing wallet
class: FighterClass              // Shitposter, Builder, VC
xp: u64                          // XP balance
abilities: [u16; 3]              // levels for 3 abilities (index 0..2)
elo: i32                         // for matchmaking/leaderboards
version: u8                      // schema version
```

Battle
```
challenger: Pubkey
opponent: Pubkey
nonce: u64                       // to make PDA unique for same pair
state: BattleState               // WaitingForCommits → WaitingForReveals → Resolved
created_slot: u64
commit_deadline_slot: u64        // after this, allows forfeit
reveal_deadline_slot: u64        // auto resolve/forfeit after
commit_challenger: Option<[u8;32]>
commit_opponent: Option<[u8;32]>
reveal_challenger: Option<MoveChoice>
reveal_opponent: Option<MoveChoice>
winner: Option<Pubkey>
```

BalanceConfig
```
admin: Pubkey
base: i32                        // base for ability power
linear_a: i32                    // slope for linear power
dim_k: i32                       // diminishing returns numerator
dim_t: i32                       // diminishing returns time constant (avoid 0)
max_level: u16                   // cap enforced on-chain
tie_break_rand: bool             // if true, break exact score ties randomly
use_dim_bonus: bool              // choose diminishing or linear
xp_base: u64                     // base XP per match to winner
xp_tie_bps: u16                  // 0..10000, share for tie (e.g., 7500)
xp_loser_bps: u16                // 0..10000, share for loser (e.g., 5000)
upgrade_c0: u64                  // upgrade cost base constant
upgrade_p_bps: u16               // exponent in basis points (e.g., 14000 => 1.4)
rps_win_base: i32                // base score for class advantage win
rps_tie_base: i32                // base score for tie
```

### Enums
- `FighterClass`: Shitposter, Builder, VC
- `MoveChoice`: MemeBomb, CopypastaStorm, ShipIt, TestnetDeploy, SeriesACannon, DueDiligenceDelay
- `BattleState`: WaitingForCommits, WaitingForReveals, Resolved

### Ability indexing
- For `Player.abilities: [u16;3]`, index mapping:
  - index 0: Shitposter ability level (applies to both Shitposter moves)
  - index 1: Builder ability level
  - index 2: VC ability level
- Enforce during reveal that move matches the player class.

### Commitment format
`commitment = keccak( move_byte || salt_32 || player_pubkey || battle_pubkey )`
- Prevents cross-battle or cross-user replay.
- `salt` is random 32 bytes per move chosen off-chain by each player.

### State machine
1) InitiateBattle: set participants, deadlines, `state = WaitingForCommits`
2) CommitMove: each side submits `commitment` before `commit_deadline_slot`
   - After both set, `state = WaitingForReveals`
3) RevealMove: submit `move_choice` and `salt` matching the stored hash before `reveal_deadline_slot`
   - When both revealed, auto-call resolve or allow `resolve_battle`
4) ResolveBattle:
   - If one side failed to commit or reveal on time, forfeit to the other
   - Else compute scores and winner, write result, award XP/ELO

### Resolution formula
- RPS base: class advantage
  - Shitposter > VC
  - VC > Builder
  - Builder > Shitposter
- Base scores:
  - winner of RPS: `rps_win_base`
  - tie classes: each gets `rps_tie_base`
- Ability bonus from level `L` of the selected class:
  - Linear: `power = base + linear_a * L`
  - Diminishing: `power = base + (dim_k * L) / (dim_t + L)` (integer approx)
- Final score per player: `score = rps_base + ability_power(L)`
- If scores equal:
  - If `tie_break_rand = true`: randomize winner using commit salts + moves (or VRF)
  - Else: challenger wins ties

### XP and ELO
- XP:
  - Winner: `xp_base`
  - Tie: `xp_base * xp_tie_bps / 10000`
  - Loser: `xp_base * xp_loser_bps / 10000`
- ELO (optional): simple K=32 system
  - `expected = 1 / (1 + 10^((opp - self)/400))`
  - `delta = round(K * (score - expected))` where `score` is 1, 0.5, or 0

### Upgrade costs
`cost(level_next) = upgrade_c0 * level_next^p`, where `p = upgrade_p_bps / 10000`
- Integer math via fixed-point exponent approximation:
  - For p in [1.00, 2.00], use piecewise or multiply polynomials
  - MVP: support p = 1.00 or 1.40 using pow via integer exp + rounding

### Instructions (IDL-style)
- `create_player(class: FighterClass)`
  - Accounts: `player (init,payer,seed)`, `authority (signer)`, `system_program`
- `upgrade_ability(ability_index: u8)`
  - Accounts: `player (mut,has_one authority)`, `authority (signer)`, `config (read)`
- `initiate_battle(opponent: Pubkey, nonce: u64, commit_deadline_slots: u64, reveal_deadline_slots: u64)`
  - Accounts: `battle (init,payer,seed)`, `challenger (signer)`, `system_program`, `clock`
- `commit_move(commitment: [u8;32])`
  - Accounts: `battle (mut)`, `player (signer)`, `clock`
- `reveal_move(move_choice: MoveChoice, salt: [u8;32])`
  - Accounts: `battle (mut)`, `player (signer)`, `player_account (mut)`, `config (read)`, `clock`
- `resolve_battle()`
  - Accounts: `battle (mut)`, `player_challenger (mut)`, `player_opponent (mut)`, `config (read)`, `clock`
- `admin_update_config(new_values...)`
  - Accounts: `config (mut, has_one admin)`, `admin (signer)`

### Events
- `BattleInitiated { battle, challenger, opponent, deadlines }`
- `MoveCommitted { battle, player }`
- `MoveRevealed { battle, player, move_choice }`
- `BattleResolved { battle, winner, challenger_score, opponent_score }`
- `XpAwarded { player, delta }`
- `AbilityUpgraded { player, ability_index, new_level, cost }`

### Errors
- NotEnoughXP, InvalidAbility, NotInBattle, InvalidReveal, AlreadyCommitted, AlreadyRevealed, DeadlinePassed, DeadlineNotReached, NotConfigured, MaxLevel, InvalidClassMove, NotReadyToResolve, AlreadyResolved

### Security and safety
- Clamp all integer math with saturating ops; check `level <= max_level`
- Deadlines prevent griefing; forfeits allow closure
- Hash commitments include player and battle to avoid replay
- Config updatable by multisig/DAO
- No tokenomics needed; XP is integers in PDA

### Directory layout
```
programs/defighter/
  src/
    lib.rs
    state/{mod.rs, player.rs, battle.rs, config.rs}
    instructions/{mod.rs, *.rs}
    logic/{mod.rs, rps.rs, scoring.rs, math.rs, vrf.rs}
    events.rs
    errors.rs
    utils.rs
docs/defighter.md
Anchor.toml
Cargo.toml (workspace)
programs/defighter/Cargo.toml
```

### Future (DNY season)
- Add new `MoveChoice` variants and a `SeasonConfig` with active move set
- Keep same PDAs; add `season: u16` to `Battle` and `Player`



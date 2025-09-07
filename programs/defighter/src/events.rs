use anchor_lang::prelude::*;
use crate::state::player::MoveChoice;

#[event]
pub struct BattleInitiated {
    pub battle: Pubkey,
    pub challenger: Pubkey,
    pub opponent: Pubkey,
    pub commit_deadline_slot: u64,
    pub reveal_deadline_slot: u64,
}

#[event]
pub struct MoveCommitted {
    pub battle: Pubkey,
    pub player: Pubkey,
}

#[event]
pub struct MoveRevealed {
    pub battle: Pubkey,
    pub player: Pubkey,
    pub move_choice: MoveChoice,
}

#[event]
pub struct BattleResolved {
    pub battle: Pubkey,
    pub winner: Pubkey,
    pub challenger_score: i32,
    pub opponent_score: i32,
}

#[event]
pub struct XpAwarded {
    pub player: Pubkey,
    pub delta: i64,
}

#[event]
pub struct AbilityUpgraded {
    pub player: Pubkey,
    pub ability_index: u8,
    pub new_level: u16,
    pub cost: u64,
}



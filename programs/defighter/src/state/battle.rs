use anchor_lang::prelude::*;
use super::player::MoveChoice;

#[account]
pub struct Battle {
    pub challenger: Pubkey,
    pub opponent: Pubkey,
    pub nonce: u64,
    pub state: BattleState,
    pub created_slot: u64,
    pub commit_deadline_slot: u64,
    pub reveal_deadline_slot: u64,
    pub commit_challenger: Option<[u8; 32]>,
    pub commit_opponent: Option<[u8; 32]>,
    pub reveal_challenger: Option<MoveChoice>,
    pub reveal_opponent: Option<MoveChoice>,
    pub winner: Option<Pubkey>,
    pub challenger_hp: u16,
    pub opponent_hp: u16,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum BattleState {
    WaitingForCommits,
    WaitingForReveals,
    Resolved,
}



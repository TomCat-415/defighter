use anchor_lang::prelude::*;

pub mod state;
pub mod logic;
pub mod instructions;
pub mod events;
pub mod errors;
pub mod utils;

use instructions::*;

declare_id!("HGkRbNawHR3PbA2h1LgqtMNCj6jcrS14c86wDUvS3dTL");

#[program]
pub mod defighter {
    use super::*;

    pub fn create_player(ctx: Context<CreatePlayer>, class: state::player::FighterClass) -> Result<()> {
        instructions::create_player::handler(ctx, class)
    }

    pub fn upgrade_ability(ctx: Context<UpgradeAbility>, ability_index: u8) -> Result<()> {
        instructions::upgrade_ability::handler(ctx, ability_index)
    }

    pub fn initiate_battle(
        ctx: Context<InitiateBattle>,
        opponent: Pubkey,
        nonce: u64,
        commit_deadline_slots: u64,
        reveal_deadline_slots: u64,
    ) -> Result<()> {
        instructions::initiate_battle::handler(ctx, opponent, nonce, commit_deadline_slots, reveal_deadline_slots)
    }

    pub fn commit_move(ctx: Context<CommitMove>, commitment: [u8; 32]) -> Result<()> {
        instructions::commit_move::handler(ctx, commitment)
    }

    pub fn reveal_move(
        ctx: Context<RevealMove>,
        move_choice: state::player::MoveChoice,
        salt: [u8; 32],
    ) -> Result<()> {
        instructions::reveal_move::handler(ctx, move_choice, salt)
    }

    pub fn resolve_battle(ctx: Context<ResolveBattle>) -> Result<()> {
        instructions::resolve_battle::handler(ctx)
    }

    pub fn admin_update_config(ctx: Context<AdminUpdateConfig>, new_config: state::config::BalanceConfig) -> Result<()> {
        instructions::admin_update_config::handler(ctx, new_config)
    }
}



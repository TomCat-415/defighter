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

    pub fn init_config(
        ctx: Context<InitConfig>,
        base: i32,
        linear_a: i32,
        dim_k: i32,
        dim_t: i32,
        max_level: u16,
        tie_break_rand: bool,
        use_dim_bonus: bool,
        xp_base: u64,
        xp_tie_bps: u16,
        xp_loser_bps: u16,
        upgrade_c0: u64,
        upgrade_p_bps: u16,
        rps_win_base: i32,
        rps_tie_base: i32,
    ) -> Result<()> {
        instructions::init_config::handler(
            ctx,
            base,
            linear_a,
            dim_k,
            dim_t,
            max_level,
            tie_break_rand,
            use_dim_bonus,
            xp_base,
            xp_tie_bps,
            xp_loser_bps,
            upgrade_c0,
            upgrade_p_bps,
            rps_win_base,
            rps_tie_base,
        )
    }

    pub fn create_character_customization(
        ctx: Context<CreateCharacterCustomization>,
        data: state::customization::CharacterCustomizationDataV1,
    ) -> Result<()> {
        instructions::create_character_customization::handler(ctx, data)
    }

    pub fn update_character_customization(
        ctx: Context<UpdateCharacterCustomization>,
        data: state::customization::CharacterCustomizationDataV1,
    ) -> Result<()> {
        instructions::update_character_customization::handler(ctx, data)
    }
}



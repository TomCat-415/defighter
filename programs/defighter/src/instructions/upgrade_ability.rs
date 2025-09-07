use anchor_lang::prelude::*;
use crate::state::{player::Player, config::BalanceConfig};
use crate::errors::CustomError;
use crate::logic::math::upgrade_cost;

#[derive(Accounts)]
pub struct UpgradeAbility<'info> {
    #[account(mut, seeds = [b"player", authority.key().as_ref()], bump, has_one = authority)]
    pub player: Account<'info, Player>,
    pub authority: Signer<'info>,
    /// CHECK: read-only config
    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, BalanceConfig>,
}

pub fn handler(ctx: Context<UpgradeAbility>, ability_index: u8) -> Result<()> {
    let player = &mut ctx.accounts.player;
    let cfg = &ctx.accounts.config;
    require!((ability_index as usize) < player.abilities.len(), CustomError::InvalidAbility);
    let idx = ability_index as usize;
    let next = player.abilities[idx].saturating_add(1);
    require!(next <= cfg.max_level, CustomError::MaxLevel);
    let cost = upgrade_cost(next, cfg);
    require!(player.xp >= cost, CustomError::NotEnoughXP);
    player.xp = player.xp.saturating_sub(cost);
    player.abilities[idx] = next;
    emit!(crate::events::AbilityUpgraded { player: player.key(), ability_index, new_level: next, cost });
    Ok(())
}



use anchor_lang::prelude::*;
use crate::state::config::BalanceConfig;

#[derive(Accounts)]
pub struct AdminUpdateConfig<'info> {
    #[account(mut, seeds = [b"config"], bump, has_one = admin)]
    pub config: Account<'info, BalanceConfig>,
    pub admin: Signer<'info>,
}

pub fn handler(ctx: Context<AdminUpdateConfig>, new_config: BalanceConfig) -> Result<()> {
    // Preserve admin; update other fields
    let admin = ctx.accounts.config.admin;
    *ctx.accounts.config = new_config;
    ctx.accounts.config.admin = admin;
    Ok(())
}



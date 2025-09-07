use anchor_lang::prelude::*;
use crate::state::config::BalanceConfig;

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(
        init,
        payer = admin,
        seeds = [b"config"],
        bump,
        space = 8 + 32 + (4*4) + 2 + 1 + 1 + 8 + 2 + 2 + 8 + 2 + 4 + 4
    )]
    pub config: Account<'info, BalanceConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
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
    let cfg = &mut ctx.accounts.config;
    cfg.admin = ctx.accounts.admin.key();
    cfg.base = base;
    cfg.linear_a = linear_a;
    cfg.dim_k = dim_k;
    cfg.dim_t = dim_t;
    cfg.max_level = max_level;
    cfg.tie_break_rand = tie_break_rand;
    cfg.use_dim_bonus = use_dim_bonus;
    cfg.xp_base = xp_base;
    cfg.xp_tie_bps = xp_tie_bps;
    cfg.xp_loser_bps = xp_loser_bps;
    cfg.upgrade_c0 = upgrade_c0;
    cfg.upgrade_p_bps = upgrade_p_bps;
    cfg.rps_win_base = rps_win_base;
    cfg.rps_tie_base = rps_tie_base;
    Ok(())
}



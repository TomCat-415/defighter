use anchor_lang::prelude::*;

#[account]
pub struct BalanceConfig {
    pub admin: Pubkey,
    pub base: i32,
    pub linear_a: i32,
    pub dim_k: i32,
    pub dim_t: i32,
    pub max_level: u16,
    pub tie_break_rand: bool,
    pub use_dim_bonus: bool,
    pub xp_base: u64,
    pub xp_tie_bps: u16,
    pub xp_loser_bps: u16,
    pub upgrade_c0: u64,
    pub upgrade_p_bps: u16,
    pub rps_win_base: i32,
    pub rps_tie_base: i32,
}



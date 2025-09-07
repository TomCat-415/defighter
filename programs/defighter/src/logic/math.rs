use crate::state::config::BalanceConfig;

pub fn ability_power(level: u16, cfg: &BalanceConfig) -> i32 {
    let l = level as i32;
    if cfg.use_dim_bonus {
        // base + (k * L) / (t + L), integer-friendly diminishing returns
        let denom = (cfg.dim_t + l).max(1);
        cfg.base.saturating_add(cfg.dim_k.saturating_mul(l) / denom)
    } else {
        cfg.base.saturating_add(cfg.linear_a.saturating_mul(l))
    }
}

pub fn powi_u64(base: u64, exp: u32) -> u64 {
    // fast exponentiation for small integer exponents
    let mut result = 1u64;
    let mut b = base;
    let mut e = exp;
    while e > 0 {
        if e & 1 == 1 { result = result.saturating_mul(b); }
        e >>= 1;
        if e > 0 { b = b.saturating_mul(b); }
    }
    result
}

pub fn upgrade_cost(level_next: u16, cfg: &BalanceConfig) -> u64 {
    // MVP: support p = 1.0 or 1.4 approximated by piecewise: level^(14/10) ~ level^1 * level^(4/10)
    // Use simple linear if p_bps == 10000
    if cfg.upgrade_p_bps == 10000 {
        return cfg.upgrade_c0.saturating_mul(level_next as u64);
    }
    // Approx fractional exponent via sqrt chaining for 0.4 ~ sqrt(sqrt(level)) ~ rough
    // Keep simple and bounded for determinism
    let l = level_next as u64;
    let approx_pow = if cfg.upgrade_p_bps == 14000 {
        let sqrt_l = integer_sqrt(l.max(1));
        let fourth_root = integer_sqrt(sqrt_l.max(1));
        l.saturating_mul(fourth_root) // ~ l^(1 + 0.5*0.5) = l^1.25; underestimates 1.4 but monotonic
    } else {
        l
    };
    cfg.upgrade_c0.saturating_mul(approx_pow)
}

pub fn integer_sqrt(n: u64) -> u64 {
    // simple integer sqrt via Newton's method
    if n == 0 { return 0; }
    let mut x = n;
    let mut y = (x + 1) >> 1;
    while y < x {
        x = y;
        y = (x + n / x) >> 1;
    }
    x
}



use crate::logic::rps::{rps_compare, RpsOutcome};
use crate::state::player::{FighterClass};
use crate::state::config::BalanceConfig;
use crate::logic::math::ability_power;

pub struct Scores { pub challenger: i32, pub opponent: i32 }

pub fn compute_scores(
    challenger_class: FighterClass,
    opponent_class: FighterClass,
    challenger_level: u16,
    opponent_level: u16,
    cfg: &BalanceConfig,
) -> (Scores, RpsOutcome) {
    let rps = rps_compare(challenger_class, opponent_class);
    let (base_c, base_o) = match rps {
        RpsOutcome::ChallengerWin => (cfg.rps_win_base, 0),
        RpsOutcome::OpponentWin => (0, cfg.rps_win_base),
        RpsOutcome::Tie => (cfg.rps_tie_base, cfg.rps_tie_base),
    };
    let bonus_c = ability_power(challenger_level, cfg);
    let bonus_o = ability_power(opponent_level, cfg);
    (
        Scores { challenger: base_c.saturating_add(bonus_c), opponent: base_o.saturating_add(bonus_o) },
        rps
    )
}



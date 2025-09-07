use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Not enough XP to upgrade")] NotEnoughXP,
    #[msg("Invalid ability index")] InvalidAbility,
    #[msg("Player not in this battle")] NotInBattle,
    #[msg("Reveal does not match commitment")] InvalidReveal,
    #[msg("Already committed")] AlreadyCommitted,
    #[msg("Already revealed")] AlreadyRevealed,
    #[msg("Commit deadline passed")] DeadlinePassed,
    #[msg("Reveal deadline passed")] RevealDeadlinePassed,
    #[msg("Too early to resolve")] NotReadyToResolve,
    #[msg("Battle already resolved")] AlreadyResolved,
    #[msg("Config not found")] NotConfigured,
    #[msg("Ability exceeds max level")] MaxLevel,
    #[msg("Move does not match player class")] InvalidClassMove,
}



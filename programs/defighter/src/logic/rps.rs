use crate::state::player::FighterClass;

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum RpsOutcome {
    ChallengerWin,
    OpponentWin,
    Tie,
}

pub fn rps_compare(challenger: FighterClass, opponent: FighterClass) -> RpsOutcome {
    use FighterClass::*;
    match (challenger, opponent) {
        (Shitposter, VC) => RpsOutcome::ChallengerWin,
        (VC, Builder) => RpsOutcome::ChallengerWin,
        (Builder, Shitposter) => RpsOutcome::ChallengerWin,

        (VC, Shitposter) => RpsOutcome::OpponentWin,
        (Builder, VC) => RpsOutcome::OpponentWin,
        (Shitposter, Builder) => RpsOutcome::OpponentWin,

        _ => RpsOutcome::Tie,
    }
}



use anchor_lang::prelude::*;

#[account]
pub struct Player {
    pub authority: Pubkey,
    pub class: FighterClass,
    pub xp: u64,
    pub abilities: [u16; 3],
    pub elo: i32,
    pub version: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum FighterClass {
    Shitposter = 0,
    Builder = 1,
    VC = 2,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MoveChoice {
    // Shitposter moves
    MemeBomb = 0,
    CopypastaStorm = 1,
    // Builder moves
    ShipIt = 2,
    TestnetDeploy = 3,
    // VC moves
    SeriesACannon = 4,
    DueDiligenceDelay = 5,
}

impl MoveChoice {
    pub fn to_byte(self) -> u8 { self as u8 }

    pub fn class(self) -> FighterClass {
        match self {
            MoveChoice::MemeBomb | MoveChoice::CopypastaStorm => FighterClass::Shitposter,
            MoveChoice::ShipIt | MoveChoice::TestnetDeploy => FighterClass::Builder,
            MoveChoice::SeriesACannon | MoveChoice::DueDiligenceDelay => FighterClass::VC,
        }
    }
}



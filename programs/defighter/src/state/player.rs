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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum FighterClass {
    Shitposter = 0,
    Builder = 1,
    VC = 2,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum MoveChoice {
    // Shitposter moves
    MemeBomb = 0,      // Basic
    RugPullRumor = 1,  // Special
    // Builder moves
    ShipIt = 2,        // Basic
    TestnetDeploy = 3, // Special
    // VC moves
    SeriesACannon = 4, // Basic
    ExitLiquidity = 5, // Special
}

impl MoveChoice {
    pub fn to_byte(self) -> u8 { self as u8 }

    pub fn class(self) -> FighterClass {
        match self {
            MoveChoice::MemeBomb | MoveChoice::RugPullRumor => FighterClass::Shitposter,
            MoveChoice::ShipIt | MoveChoice::TestnetDeploy => FighterClass::Builder,
            MoveChoice::SeriesACannon | MoveChoice::ExitLiquidity => FighterClass::VC,
        }
    }

    pub fn is_special_move(self) -> bool {
        matches!(self, 
            MoveChoice::RugPullRumor | 
            MoveChoice::TestnetDeploy | 
            MoveChoice::ExitLiquidity
        )
    }
}



use anchor_lang::prelude::*;
use crate::state::player::{Player, FighterClass, MoveChoice};

/// Battle outcome for a single move
#[derive(Debug, Clone)]
pub struct BattleOutcome {
    pub damage_dealt: u16,
    pub move_result: MoveResult,
    pub remaining_hp: u16,
}

/// Result of a move execution
#[derive(Debug, Clone, PartialEq)]
pub enum MoveResult {
    BasicHit,
    SpecialMiss,
    SpecialHit,
    SpecialCritical,
}

/// Calculate damage for a move
pub fn calculate_damage(
    move_choice: MoveChoice,
    attacker: &Player,
    defender_class: FighterClass,
    vrf_result: u64,
) -> u16 {
    // Base damage is always 100
    let base_damage = 100.0;
    
    // Class advantage multiplier
    let class_advantage = get_class_advantage(move_choice.class(), defender_class);
    
    // Player power progression
    let player_power = calculate_player_power(attacker);
    
    // Move outcome multiplier
    let (move_multiplier, _move_result) = get_move_outcome(move_choice, vrf_result);
    
    // Final damage calculation
    let final_damage = base_damage * class_advantage * player_power * move_multiplier;
    
    final_damage as u16
}

/// Calculate battle outcome with move result
pub fn calculate_battle_outcome(
    move_choice: MoveChoice,
    attacker: &Player,
    defender_class: FighterClass,
    defender_hp: u16,
    vrf_result: u64,
) -> BattleOutcome {
    let base_damage = 100.0;
    let class_advantage = get_class_advantage(move_choice.class(), defender_class);
    let player_power = calculate_player_power(attacker);
    let (move_multiplier, move_result) = get_move_outcome(move_choice, vrf_result);
    
    let final_damage = (base_damage * class_advantage * player_power * move_multiplier) as u16;
    let remaining_hp = defender_hp.saturating_sub(final_damage);
    
    BattleOutcome {
        damage_dealt: final_damage,
        move_result,
        remaining_hp,
    }
}

/// Get class advantage multiplier (rock-paper-scissors)
fn get_class_advantage(attacker_class: FighterClass, defender_class: FighterClass) -> f64 {
    use FighterClass::*;
    
    match (attacker_class, defender_class) {
        // Winning matchups (25% bonus)
        (Shitposter, VC) => 1.25,      // Memes destroy reputations
        (VC, Builder) => 1.25,         // Funding controls roadmaps  
        (Builder, Shitposter) => 1.25, // Shipping beats hype
        
        // Losing matchups (20% penalty)
        (VC, Shitposter) => 0.80,      
        (Builder, VC) => 0.80,         
        (Shitposter, Builder) => 0.80, 
        
        // Same class (neutral)
        _ => 1.0,
    }
}

/// Calculate player power progression multiplier
fn calculate_player_power(player: &Player) -> f64 {
    // Total ability levels bonus
    let total_levels: u16 = player.abilities.iter().sum();
    let ability_bonus = (total_levels as f64) * 0.05;
    
    // XP tier bonus  
    let xp_tier = (player.xp / 1000) as f64;
    let xp_bonus = xp_tier * 0.02;
    
    1.0 + ability_bonus + xp_bonus
}

/// Determine move outcome based on VRF and move type
fn get_move_outcome(move_choice: MoveChoice, vrf_result: u64) -> (f64, MoveResult) {
    if !move_choice.is_special_move() {
        // Basic moves always hit for 1.0x damage
        return (1.0, MoveResult::BasicHit);
    }
    
    // Convert VRF to percentage (0-100)
    let roll = (vrf_result % 100) as u8;
    
    match move_choice {
        MoveChoice::RugPullRumor => {
            // 30% miss, 50% hit (1.5x), 20% crit (2.2x)
            if roll < 30 {
                (0.0, MoveResult::SpecialMiss)
            } else if roll < 80 {
                (1.5, MoveResult::SpecialHit)  
            } else {
                (2.2, MoveResult::SpecialCritical)
            }
        },
        MoveChoice::TestnetDeploy => {
            // 25% miss, 55% hit (1.6x), 20% crit (2.3x)
            if roll < 25 {
                (0.0, MoveResult::SpecialMiss)
            } else if roll < 80 {
                (1.6, MoveResult::SpecialHit)
            } else {
                (2.3, MoveResult::SpecialCritical)
            }
        },
        MoveChoice::ExitLiquidity => {
            // 35% miss, 45% hit (1.4x), 20% crit (2.0x)
            if roll < 35 {
                (0.0, MoveResult::SpecialMiss)
            } else if roll < 80 {
                (1.4, MoveResult::SpecialHit)
            } else {
                (2.0, MoveResult::SpecialCritical)
            }
        },
        // Basic moves (should not reach here due to early return)
        _ => (1.0, MoveResult::BasicHit),
    }
}

/// Calculate expected damage for strategic AI (optional future use)
pub fn calculate_expected_damage(
    move_choice: MoveChoice,
    attacker: &Player,
    defender_class: FighterClass,
) -> f64 {
    let base_damage = 100.0;
    let class_advantage = get_class_advantage(move_choice.class(), defender_class);
    let player_power = calculate_player_power(attacker);
    
    let expected_multiplier = if !move_choice.is_special_move() {
        1.0 // Basic moves
    } else {
        match move_choice {
            MoveChoice::RugPullRumor => 0.30 * 0.0 + 0.50 * 1.5 + 0.20 * 2.2, // = 1.19
            MoveChoice::TestnetDeploy => 0.25 * 0.0 + 0.55 * 1.6 + 0.20 * 2.3, // = 1.34
            MoveChoice::ExitLiquidity => 0.35 * 0.0 + 0.45 * 1.4 + 0.20 * 2.0, // = 1.03
            _ => 1.0,
        }
    };
    
    base_damage * class_advantage * player_power * expected_multiplier
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_class_advantages() {
        // Shitposter > VC
        assert_eq!(get_class_advantage(FighterClass::Shitposter, FighterClass::VC), 1.25);
        assert_eq!(get_class_advantage(FighterClass::VC, FighterClass::Shitposter), 0.80);
        
        // VC > Builder  
        assert_eq!(get_class_advantage(FighterClass::VC, FighterClass::Builder), 1.25);
        assert_eq!(get_class_advantage(FighterClass::Builder, FighterClass::VC), 0.80);
        
        // Builder > Shitposter
        assert_eq!(get_class_advantage(FighterClass::Builder, FighterClass::Shitposter), 1.25);
        assert_eq!(get_class_advantage(FighterClass::Shitposter, FighterClass::Builder), 0.80);
    }
    
    #[test] 
    fn test_player_power() {
        let player = Player {
            authority: Pubkey::default(),
            class: FighterClass::Shitposter,
            xp: 2500, // Tier 2
            abilities: [4, 3, 2], // 9 total levels
            elo: 1000,
            version: 1,
        };
        
        // Expected: 1.0 + (9 * 0.05) + (2 * 0.02) = 1.49
        assert_eq!(calculate_player_power(&player), 1.49);
    }
}
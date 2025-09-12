use anchor_lang::prelude::*;
use crate::state::{battle::{Battle, BattleState}, player::{Player, FighterClass}};
use crate::state::config::BalanceConfig;
use crate::errors::CustomError;
use crate::logic::{calculate_battle_outcome, tie_break_entropy};

#[derive(Accounts)]
pub struct ResolveBattle<'info> {
    #[account(mut)]
    pub battle: Account<'info, Battle>,
    #[account(mut, seeds = [b"player", battle.challenger.as_ref()], bump)]
    pub player_challenger: Account<'info, Player>,
    #[account(mut, seeds = [b"player", battle.opponent.as_ref()], bump)]
    pub player_opponent: Account<'info, Player>,
    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, BalanceConfig>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<ResolveBattle>) -> Result<()> {
    let battle = &mut ctx.accounts.battle;
    require!(!matches!(battle.state, BattleState::Resolved), CustomError::AlreadyResolved);
    // Allow resolve if both revealed, or after reveal deadline (forfeit)
    let after_reveal_deadline = ctx.accounts.clock.slot > battle.reveal_deadline_slot;

    let both_revealed = battle.reveal_challenger.is_some() && battle.reveal_opponent.is_some();
    require!(both_revealed || after_reveal_deadline, CustomError::NotReadyToResolve);

    let mut winner = None;
    let cfg = &ctx.accounts.config;

    if both_revealed {
        // Get moves and calculate battle outcomes
        let c_move = battle.reveal_challenger.unwrap();
        let o_move = battle.reveal_opponent.unwrap();
        
        // Get VRF for each move
        let c_vrf = tie_break_entropy(
            c_move as u8,
            o_move as u8,
            &[0u8; 32], // TODO: Use actual commitment salt when available
            &[0u8; 32], // TODO: Use actual commitment salt when available
            &battle.key(),
        );
        let o_vrf = tie_break_entropy(
            o_move as u8,
            c_move as u8,
            &[0u8; 32], // TODO: Use actual commitment salt when available
            &[0u8; 32], // TODO: Use actual commitment salt when available
            &battle.key(),
        );
        
        // DEBUG: Log the inputs to battle outcome calculation
        msg!("DEBUG: Challenger move: {:?}, attacking opponent (class: {:?}) with {} HP", 
            c_move, ctx.accounts.player_opponent.class, battle.opponent_hp);
        msg!("DEBUG: Opponent move: {:?}, attacking challenger (class: {:?}) with {} HP", 
            o_move, ctx.accounts.player_challenger.class, battle.challenger_hp);

        // Calculate damage for each player's move
        let challenger_outcome = calculate_battle_outcome(
            c_move,
            &ctx.accounts.player_challenger,
            ctx.accounts.player_opponent.class,
            battle.opponent_hp,
            c_vrf,
        );
        
        let opponent_outcome = calculate_battle_outcome(
            o_move,
            &ctx.accounts.player_opponent,
            ctx.accounts.player_challenger.class,
            battle.challenger_hp,
            o_vrf,
        );
        
        // DEBUG: Log the outcomes
        msg!("DEBUG: Challenger outcome - damage: {}, remaining_hp: {}", 
            challenger_outcome.damage_dealt, challenger_outcome.remaining_hp);
        msg!("DEBUG: Opponent outcome - damage: {}, remaining_hp: {}", 
            opponent_outcome.damage_dealt, opponent_outcome.remaining_hp);
        
        // Store starting HP for true damage calculation
        let challenger_start_hp = battle.challenger_hp as i32;
        let opponent_start_hp = battle.opponent_hp as i32;
        
        // Apply the correctly calculated remaining HP
        battle.challenger_hp = opponent_outcome.remaining_hp;  // Challenger's HP after opponent's attack
        battle.opponent_hp = challenger_outcome.remaining_hp;  // Opponent's HP after challenger's attack
        
        // Calculate true final HP (allowing negative values for better tiebreaking)
        let challenger_true_hp = challenger_start_hp - (opponent_outcome.damage_dealt as i32);
        let opponent_true_hp = opponent_start_hp - (challenger_outcome.damage_dealt as i32);
        
        // Determine winner based on remaining HP (using true HP for ties when both die)
        if battle.challenger_hp == 0 && battle.opponent_hp == 0 {
            // Both died - whoever has less negative HP wins (took less overkill damage)
            if challenger_true_hp > opponent_true_hp {
                winner = Some(battle.challenger); // e.g., -20 > -50
            } else if opponent_true_hp > challenger_true_hp {
                winner = Some(battle.opponent);
            } else {
                // True tie (same negative HP) - use damage dealt as tiebreaker
                if challenger_outcome.damage_dealt > opponent_outcome.damage_dealt {
                    winner = Some(battle.challenger);
                } else if opponent_outcome.damage_dealt > challenger_outcome.damage_dealt {
                    winner = Some(battle.opponent);
                } else {
                    // Ultimate tie - use VRF
                    if cfg.tie_break_rand {
                        winner = Some(if c_vrf % 2 == 0 { battle.challenger } else { battle.opponent });
                    } else {
                        winner = Some(battle.challenger);
                    }
                }
            }
        } else if battle.challenger_hp == 0 {
            winner = Some(battle.opponent);
        } else if battle.opponent_hp == 0 {
            winner = Some(battle.challenger);
        } else {
            // Neither died - higher HP wins, or higher damage dealt as tiebreaker
            if battle.challenger_hp > battle.opponent_hp {
                winner = Some(battle.challenger);
            } else if battle.opponent_hp > battle.challenger_hp {
                winner = Some(battle.opponent);
            } else {
                // Same HP remaining - higher damage dealt wins
                if challenger_outcome.damage_dealt > opponent_outcome.damage_dealt {
                    winner = Some(battle.challenger);
                } else if opponent_outcome.damage_dealt > challenger_outcome.damage_dealt {
                    winner = Some(battle.opponent);
                } else {
                    // True tie - use VRF
                    if cfg.tie_break_rand {
                        winner = Some(if c_vrf % 2 == 0 { battle.challenger } else { battle.opponent });
                    } else {
                        winner = Some(battle.challenger);
                    }
                }
            }
        }

        emit!(crate::events::BattleResolved {
            battle: battle.key(),
            winner: winner.unwrap(),
            challenger_hp: battle.challenger_hp,
            opponent_hp: battle.opponent_hp,
            challenger_damage: challenger_outcome.damage_dealt,
            opponent_damage: opponent_outcome.damage_dealt,
        });

        award_xp(&mut ctx.accounts.player_challenger, &mut ctx.accounts.player_opponent, winner.unwrap(), cfg);
    } else {
        // Forfeit path
        if battle.reveal_challenger.is_some() && battle.reveal_opponent.is_none() {
            winner = Some(battle.challenger);
        } else if battle.reveal_opponent.is_some() && battle.reveal_challenger.is_none() {
            winner = Some(battle.opponent);
        } else if battle.commit_challenger.is_some() && battle.commit_opponent.is_none() {
            winner = Some(battle.challenger);
        } else if battle.commit_opponent.is_some() && battle.commit_challenger.is_none() {
            winner = Some(battle.opponent);
        } else {
            // no participation: challenger wins by default to allow closure
            winner = Some(battle.challenger);
        }
        emit!(crate::events::BattleResolved { 
            battle: battle.key(), 
            winner: winner.unwrap(), 
            challenger_hp: battle.challenger_hp,
            opponent_hp: battle.opponent_hp,
            challenger_damage: 0,
            opponent_damage: 0,
        });
        award_xp(&mut ctx.accounts.player_challenger, &mut ctx.accounts.player_opponent, winner.unwrap(), cfg);
    }

    battle.winner = winner;
    battle.state = BattleState::Resolved;
    Ok(())
}

fn level_for_class(player: &Player, class: FighterClass) -> u16 {
    match class {
        FighterClass::Shitposter => player.abilities[0],
        FighterClass::Builder => player.abilities[1],
        FighterClass::VC => player.abilities[2],
    }
}

fn award_xp(pc: &mut Player, po: &mut Player, winner: Pubkey, cfg: &BalanceConfig) {
    if winner == pc.authority {
        pc.xp = pc.xp.saturating_add(cfg.xp_base);
        let delta = (cfg.xp_loser_bps as u64).saturating_mul(cfg.xp_base) / 10000;
        po.xp = po.xp.saturating_add(delta);
        emit!(crate::events::XpAwarded { player: pc.authority, delta: cfg.xp_base as i64 });
        emit!(crate::events::XpAwarded { player: po.authority, delta: delta as i64 });
    } else {
        po.xp = po.xp.saturating_add(cfg.xp_base);
        let delta = (cfg.xp_loser_bps as u64).saturating_mul(cfg.xp_base) / 10000;
        pc.xp = pc.xp.saturating_add(delta);
        emit!(crate::events::XpAwarded { player: po.authority, delta: cfg.xp_base as i64 });
        emit!(crate::events::XpAwarded { player: pc.authority, delta: delta as i64 });
    }
}



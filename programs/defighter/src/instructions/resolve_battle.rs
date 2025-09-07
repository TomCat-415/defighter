use anchor_lang::prelude::*;
use crate::state::{battle::{Battle, BattleState}, player::{Player, FighterClass}};
use crate::state::config::BalanceConfig;
use crate::errors::CustomError;
use crate::logic::{compute_scores};

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
        // Compute scores
        let c_move = battle.reveal_challenger.unwrap();
        let o_move = battle.reveal_opponent.unwrap();
        let (scores, _rps) = compute_scores(
            c_move.class(),
            o_move.class(),
            level_for_class(&ctx.accounts.player_challenger, c_move.class()),
            level_for_class(&ctx.accounts.player_opponent, o_move.class()),
            cfg,
        );
        if scores.challenger > scores.opponent { winner = Some(battle.challenger); }
        else if scores.opponent > scores.challenger { winner = Some(battle.opponent); }
        else {
            // tie: choose based on cfg or default challenger
            if cfg.tie_break_rand {
                // fallback tie-break: challenger wins if slot is even else opponent
                winner = Some(if ctx.accounts.clock.slot % 2 == 0 { battle.challenger } else { battle.opponent });
            } else {
                winner = Some(battle.challenger);
            }
        }

        emit!(crate::events::BattleResolved {
            battle: battle.key(),
            winner: winner.unwrap(),
            challenger_score: scores.challenger,
            opponent_score: scores.opponent,
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
        emit!(crate::events::BattleResolved { battle: battle.key(), winner: winner.unwrap(), challenger_score: 0, opponent_score: 0 });
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



use anchor_lang::prelude::*;
use crate::state::{battle::{Battle, BattleState}, player::{Player, MoveChoice}};
use crate::errors::CustomError;

#[derive(Accounts)]
pub struct RevealMove<'info> {
    #[account(mut)]
    pub battle: Account<'info, Battle>,
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [b"player", player.key().as_ref()],
        bump,
        constraint = player_account.authority == player.key() @ CustomError::NotInBattle
    )]
    /// CHECK: the linked player account of signer
    pub player_account: Account<'info, Player>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<RevealMove>, move_choice: MoveChoice, salt: [u8; 32]) -> Result<()> {
    let battle = &mut ctx.accounts.battle;
    require!(matches!(battle.state, BattleState::WaitingForReveals), CustomError::NotReadyToResolve);
    require!(ctx.accounts.clock.slot <= battle.reveal_deadline_slot, CustomError::RevealDeadlinePassed);
    let key = ctx.accounts.player.key();

    // Enforce class-move consistency
    require!(move_choice.class() == ctx.accounts.player_account.class, CustomError::InvalidClassMove);

    let battle_key = battle.key();
    let expected = anchor_lang::solana_program::keccak::hashv(&[
        &[move_choice.to_byte()],
        &salt,
        key.as_ref(),
        battle_key.as_ref(),
    ]).0;

    if key == battle.challenger {
        require!(battle.commit_challenger == Some(expected), CustomError::InvalidReveal);
        require!(battle.reveal_challenger.is_none(), CustomError::AlreadyRevealed);
        battle.reveal_challenger = Some(move_choice);
    } else if key == battle.opponent {
        require!(battle.commit_opponent == Some(expected), CustomError::InvalidReveal);
        require!(battle.reveal_opponent.is_none(), CustomError::AlreadyRevealed);
        battle.reveal_opponent = Some(move_choice);
    } else {
        return err!(CustomError::NotInBattle);
    }

    emit!(crate::events::MoveRevealed { battle: battle.key(), player: key, move_choice });
    Ok(())
}



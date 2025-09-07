use anchor_lang::prelude::*;
use crate::state::battle::{Battle, BattleState};
use crate::errors::CustomError;

#[derive(Accounts)]
pub struct CommitMove<'info> {
    #[account(mut)]
    pub battle: Account<'info, Battle>,
    pub player: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<CommitMove>, commitment: [u8; 32]) -> Result<()> {
    let battle = &mut ctx.accounts.battle;
    require!(matches!(battle.state, BattleState::WaitingForCommits), CustomError::NotReadyToResolve);
    require!(ctx.accounts.clock.slot <= battle.commit_deadline_slot, CustomError::DeadlinePassed);
    let key = ctx.accounts.player.key();
    if key == battle.challenger {
        require!(battle.commit_challenger.is_none(), CustomError::AlreadyCommitted);
        battle.commit_challenger = Some(commitment);
    } else if key == battle.opponent {
        require!(battle.commit_opponent.is_none(), CustomError::AlreadyCommitted);
        battle.commit_opponent = Some(commitment);
    } else {
        return err!(CustomError::NotInBattle);
    }

    emit!(crate::events::MoveCommitted { battle: battle.key(), player: key });

    if battle.commit_challenger.is_some() && battle.commit_opponent.is_some() {
        battle.state = BattleState::WaitingForReveals;
    }
    Ok(())
}



use anchor_lang::prelude::*;
use crate::state::{battle::{Battle, BattleState}, player::Player};

#[derive(Accounts)]
#[instruction(opponent: Pubkey, nonce: u64, commit_deadline_slots: u64, reveal_deadline_slots: u64)]
pub struct InitiateBattle<'info> {
    #[account(
        init,
        payer = challenger,
        seeds = [b"battle", challenger.key().as_ref(), opponent.as_ref(), &nonce.to_le_bytes()],
        bump,
        space = 8 + 32 + 32 + 8 + 1 + 8 + 8 + 8 + (1+32) + (1+32) + (1+1) + (1+1) + (1+32)
    )]
    pub battle: Account<'info, Battle>,
    #[account(mut)]
    pub challenger: Signer<'info>,
    /// CHECK: opponent just a Pubkey; no need to load Player here
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(
    ctx: Context<InitiateBattle>,
    opponent: Pubkey,
    nonce: u64,
    commit_deadline_slots: u64,
    reveal_deadline_slots: u64,
) -> Result<()> {
    let battle = &mut ctx.accounts.battle;
    let challenger = ctx.accounts.challenger.key();
    let now = ctx.accounts.clock.slot;
    battle.challenger = challenger;
    battle.opponent = opponent;
    battle.nonce = nonce;
    battle.state = BattleState::WaitingForCommits;
    battle.created_slot = now;
    battle.commit_deadline_slot = now.saturating_add(commit_deadline_slots);
    battle.reveal_deadline_slot = battle.commit_deadline_slot.saturating_add(reveal_deadline_slots);
    battle.commit_challenger = None;
    battle.commit_opponent = None;
    battle.reveal_challenger = None;
    battle.reveal_opponent = None;
    battle.winner = None;

    emit!(crate::events::BattleInitiated {
        battle: battle.key(),
        challenger,
        opponent,
        commit_deadline_slot: battle.commit_deadline_slot,
        reveal_deadline_slot: battle.reveal_deadline_slot,
    });
    Ok(())
}



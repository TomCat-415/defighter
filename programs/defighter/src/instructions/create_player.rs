use anchor_lang::prelude::*;
use crate::state::player::{Player, FighterClass};

#[derive(Accounts)]
#[instruction(class: FighterClass)]
pub struct CreatePlayer<'info> {
    /// The payer who will fund the rent for the new player account (user wallet)
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        seeds = [b"player", authority.key().as_ref()],
        bump,
        space = 8 + 32 + 1 + 8 + (2*3) + 4 + 1
    )]
    pub player: Account<'info, Player>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreatePlayer>, class: FighterClass) -> Result<()> {
    let player = &mut ctx.accounts.player;
    player.authority = ctx.accounts.authority.key();
    player.class = class;
    player.xp = 0;
    player.abilities = [0, 0, 0];
    player.elo = 1000;
    player.version = 1;
    Ok(())
}



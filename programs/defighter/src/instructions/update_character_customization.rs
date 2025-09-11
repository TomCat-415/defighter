use anchor_lang::prelude::*;
use crate::state::{Player, CharacterCustomizationV1, CharacterCustomizationDataV1, CHARACTER_CUSTOM_SEED};

#[derive(Accounts)]
pub struct UpdateCharacterCustomization<'info> {
    #[account(mut)]
    pub player: Account<'info, Player>,
    #[account(
        mut,
        seeds = [CHARACTER_CUSTOM_SEED, player.key().as_ref()],
        bump,
        has_one = player,
    )]
    pub character_customization: Account<'info, CharacterCustomizationV1>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateCharacterCustomization>, data: CharacterCustomizationDataV1) -> Result<()> {
    let player = &ctx.accounts.player;
    require!(player.authority == ctx.accounts.authority.key(), error!(crate::errors::GameError::Unauthorized));

    let acct = &mut ctx.accounts.character_customization;
    // Keep player, version intact
    acct.gender = data.gender;
    acct.palette_index = data.palette_index;
    acct.skin_tone_index = data.skin_tone_index;
    acct.hair_style_index = data.hair_style_index;
    acct.hair_color_index = data.hair_color_index;
    acct.outfit_style_index = data.outfit_style_index;
    acct.outfit_color_index = data.outfit_color_index;
    acct.face_flags = data.face_flags;
    acct.accessory_slots = data.accessory_slots;
    Ok(())
}



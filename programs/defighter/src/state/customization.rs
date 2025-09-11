use anchor_lang::prelude::*;

pub const CHARACTER_CUSTOM_SEED: &[u8] = b"character_custom";

#[account]
pub struct CharacterCustomizationV1 {
    pub player: Pubkey,            // 32
    pub gender: u8,                // 0=Male,1=Female,2=NonBinary
    pub palette_index: u8,         // 0..N (defined client-side)
    pub skin_tone_index: u8,       // 0..7
    pub hair_style_index: u8,      // 0..11
    pub hair_color_index: u8,      // 0..5
    pub outfit_style_index: u8,    // 0..5 (battle-only)
    pub outfit_color_index: u8,    // 0..4
    pub face_flags: u16,           // bitfield: mustache(0), lipstick(1), glasses(2), eyebrows_alt(3), mouth_alt(4)
    pub accessory_slots: [u8; 2],  // 0=headwear, 1=weapon (255=none)
    pub version: u8,               // =1
    pub reserved: [u8; 24],        // future expansion
}

impl CharacterCustomizationV1 {
    pub const VERSION: u8 = 1;
    pub const SPACE: usize = 8 /*disc*/ + 68; // discriminator + struct size
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default)]
pub struct CharacterCustomizationDataV1 {
    pub gender: u8,
    pub palette_index: u8,
    pub skin_tone_index: u8,
    pub hair_style_index: u8,
    pub hair_color_index: u8,
    pub outfit_style_index: u8,
    pub outfit_color_index: u8,
    pub face_flags: u16,
    pub accessory_slots: [u8; 2],
}



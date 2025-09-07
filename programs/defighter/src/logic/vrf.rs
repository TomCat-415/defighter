use anchor_lang::prelude::*;

pub fn tie_break_entropy(
    challenger_move_byte: u8,
    opponent_move_byte: u8,
    challenger_salt: &[u8; 32],
    opponent_salt: &[u8; 32],
    battle_pubkey: &Pubkey,
) -> u64 {
    // Use keccak in-program for deterministic pseudo-randomness from the commitments
    let c_arr = [challenger_move_byte];
    let o_arr = [opponent_move_byte];
    let bytes = [
        c_arr.as_ref(),
        o_arr.as_ref(),
        challenger_salt,
        opponent_salt,
        battle_pubkey.as_ref(),
    ];
    let hash = anchor_lang::solana_program::keccak::hashv(&bytes);
    // take first 8 bytes as u64
    u64::from_le_bytes(hash.0[0..8].try_into().unwrap())
}



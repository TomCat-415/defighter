# DeFighter Character Customization & Progression Plan

## Overview
This document outlines the character customization and progression system for DeFighter, focusing on single-character progression with class switching capabilities and cosmetic customization with minor gameplay effects.

## Core Character System

### Single Character Per Wallet
- **One character per wallet** - encourages meaningful class choice
- **Class switching available** - expensive reset mechanism allows experimentation
- **Simple PDA structure** - one player account per wallet authority
- **Clear identity** - players become known for their main class choice

### Class Switching Mechanism
- **Cost**: Expensive XP/SOL cost to prevent frequent switching
- **Reset**: Abilities reset to level 0, keep some XP (25-50%)
- **Cooldown**: 7-day cooldown between switches
- **Confirmation**: Multi-step confirmation to prevent accidental switches

## Character Customization System

### Phase 1: Basic Customization (MVP)
**Visual Options**:
- Gender selection (Male/Female/Non-binary)
- Color schemes (5-8 palettes per class)
- Basic accessories (3-5 options per class)

**Technical Implementation**:
- Store customization data in player account (8-16 bytes)
- Simple enum-based selection system
- No gameplay effects initially

### Phase 2: Gear & Gameplay Effects
**Gear System**:
- **Head gear**: Hats, headphones, glasses
- **Body gear**: Clothing, armor, accessories  
- **Backgrounds**: Office setups, environments

**Gameplay Effects** (Small bonuses only):
- **XP Multipliers**: +1% to +5% XP gain
- **Battle Bonuses**: +1% to +3% effectiveness
- **Stat Boosts**: +1 to +2 ability points maximum

**Class-Specific Customization**:

**Shitposter**:
- Meme stickers and decals
- Phone/laptop models
- Clothing styles (hoodies, streetwear)
- Chair/setup variations

**Builder**:
- Development environments (VS Code themes, terminal styles)
- Laptop brands and setups
- Hoodie designs and coding accessories
- Keyboard/mouse customization

**VC Chad**:
- Suit styles and colors
- Watch brands and accessories  
- Office backgrounds
- Car/lifestyle elements

### Phase 3: NFT Integration
**Curated Collection Approach**:
- Partner with 2-3 major Solana NFT collections initially
- Map specific NFT traits to in-game cosmetics
- Verify on-chain ownership for exclusive unlocks

**Potential Launch Partners**:
- **DeGods**: Exclusive VC Chad accessories (chains, crowns)
- **Solana Monkey Business**: Builder character elements  
- **Mad Lads**: Shitposter cosmetics and styling
- **Okay Bears**: Casual/comfort items for all classes

**NFT Integration Benefits**:
- **Exclusive cosmetics**: Only available to NFT holders
- **Small stat bonuses**: 1-3% bonuses for rare traits
- **Cross-promotion**: Attract NFT communities to game
- **Revenue sharing**: Potential royalty arrangements

## Technical Architecture

### Data Storage
```rust
// Player account structure
pub struct Player {
    pub authority: Pubkey,
    pub class: FighterClass,
    pub abilities: [u16; 3],
    pub xp: u64,
    pub elo: i32,
    pub customization: CustomizationData, // New field
    pub version: u8,
}

// Customization data (fits in ~32 bytes)
pub struct CustomizationData {
    pub gender: u8,        // 0-2
    pub color_scheme: u8,  // 0-15
    pub head_gear: u8,     // 0-31
    pub body_gear: u8,     // 0-31
    pub background: u8,    // 0-31
    pub nft_cosmetics: [u8; 4], // NFT-based items
    pub reserved: [u8; 20], // Future expansion
}
```

### On-chain Customization v1 (versioned, minimal indices)
```rust
// PDA: ["character_custom", player]
#[account]
pub struct CharacterCustomizationV1 {
    pub player: Pubkey,           // 32
    pub gender: u8,               // 0=Male,1=Female,2=NonBinary
    pub palette_index: u8,        // 0..N (client manifest)
    pub skin_tone_index: u8,      // 0..7
    pub hair_style_index: u8,     // 0..11
    pub hair_color_index: u8,     // 0..5
    pub outfit_style_index: u8,   // 0..5 (battle-only; optional)
    pub outfit_color_index: u8,   // 0..4
    pub face_flags: u16,          // bitfield: mustache(0), lipstick(1), glasses(2), eyebrows_alt(3), mouth_alt(4)
    pub accessory_slots: [u8; 2], // 0=headwear,1=weapon (255=none)
    pub version: u8,              // starts at 1
    pub reserved: [u8; 24],       // padding for future upgrades
}
```

Design notes:
- Store only indices/flags; rendering is 100% off-chain via a manifest mapping indices → assets/colors.
- Never reorder existing IDs in the manifest; append new ones and keep aliases for deprecated.
- If we outgrow `reserved`, add `CharacterCustomizationV2` under new seeds and gracefully fall back to V1 when V2 is absent.

### V2 Migration Strategy (future-proofing)
- Introduce `CharacterCustomizationV2` with added fields (e.g., backgrounds, animations).
- Add a migration instruction that reads V1, writes V2, and closes V1 to reclaim rent (optional).
- Frontend loads V2 if present else V1; both map into the same client-side `Customization` DTO.

### Off-chain Manifest (assets and palettes)
- JSON hosted in the app (or CDN) describing palettes, hair/outfits, and layer order for two renderers: `avatar` (face) and `battle` (body).
- Changing art, palettes, or layer composition is a manifest/assets update only; on-chain data remains stable.


### NFT Verification
- On-chain verification of NFT ownership
- Caching system for frequently checked collections
- Graceful fallback when NFTs are sold/transferred

### Gameplay Effect Calculation
```typescript
// Example bonus calculation
function calculateBattleBonus(player: Player): number {
    let bonus = 1.0; // Base multiplier
    
    // Gear bonuses (max 5% total)
    bonus += getGearBonus(player.customization) * 0.01;
    
    // NFT trait bonuses (max 3% total)  
    bonus += getNftTraitBonus(player.nft_cosmetics) * 0.01;
    
    return Math.min(bonus, 1.08); // Cap at 8% total bonus
}
```

## Implementation Roadmap

### Phase 1 (Current): Basic System
- [x] Single character per wallet
- [ ] Basic gender/color customization
- [ ] Simple cosmetic selection UI
- [ ] Class switching mechanism

### Phase 2 (Next): Enhanced Customization  
- [ ] Gear system with visual variety
- [ ] Small gameplay effect bonuses
- [ ] Achievement-based unlocks
- [ ] Improved character display

### Phase 3 (Future): NFT Integration
- [ ] Partner collection integration
- [ ] NFT trait mapping system
- [ ] Exclusive cosmetic unlocks
- [ ] Cross-project promotional events

## Balancing Principles

### Cosmetic First, Gameplay Second
- Visual customization should be the primary appeal
- Gameplay effects should feel meaningful but not mandatory
- Never create "pay-to-win" scenarios

### Accessibility
- Core gameplay remains fully accessible without purchases
- Free customization options for each category
- NFT integration provides exclusivity, not advantage

### Community Engagement
- Seasonal cosmetic releases
- Community voting on new customization options
- Social features to show off customization

## Economic Considerations

### Revenue Streams
1. **In-game cosmetic purchases** (SOL/tokens)
2. **Class switching fees** 
3. **NFT partnership revenue**
4. **Seasonal pass/battle pass system**

### Costs
- **Art asset creation** - significant initial investment
- **NFT integration development** - moderate ongoing cost
- **Community management** - partnerships and events

## Success Metrics

### Engagement
- Character customization adoption rate
- Class switching frequency  
- Time spent in customization menus
- Social sharing of character designs

### Revenue
- Cosmetic purchase conversion rate
- NFT holder engagement increase
- Average revenue per customization user

### Community
- NFT partner community growth
- User-generated content featuring customization
- Community satisfaction with cosmetic options

---

*This document should be updated as the system evolves and community feedback is incorporated.*
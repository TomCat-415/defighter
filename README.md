# DeFighter 🥊⚔️

**A fully on-chain PvP fighting game on Solana featuring crypto-native character archetypes and commit-reveal battle mechanics.**

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://solana.com/)
[![Anchor](https://img.shields.io/badge/Anchor-0.31.x-663399)](https://anchor-lang.com/)
[![Rust](https://img.shields.io/badge/Rust-Latest-000000?logo=rust)](https://www.rust-lang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.4-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-000000?logo=next.js)](https://nextjs.org/)

## 🎮 [**» PLAY NOW «**](https://defighter.vercel.app)

**Try the live demo**: Connect your wallet, create your crypto archetype, and battle on-chain at [defighter.vercel.app](https://defighter.vercel.app)

### 🔧 Setup Required:
1. **Switch your wallet to Devnet** (Settings → Change Network → Devnet)
2. **Get free devnet SOL** from [Solana faucet](https://faucet.solana.com/)
3. **Connect and play!**

⚠️ **Security Warnings Expected**: Phantom wallet may show "potentially malicious" warnings for devnet dapps. This is normal for development/testing - click "Proceed Anyway" to continue.

### 🚦 Current Status:
- ✅ **Profile & Character Creation**: Fully functional on live site
- ✅ **Battle Demo**: Working on both local and live deployment with robust error handling
- ✅ **Core Mechanics**: Commit-reveal, damage calculation, XP system, on-chain battles
- ✅ **Production Ready**: Secure API key handling, extended timeouts, blockhash retry logic
- 🎨 **UI/UX**: Placeholder design - currently basic attack only, special attacks coming next
- 🎯 **Focus**: Core blockchain functionality first, UI polish second

---

## What is DeFighter?

DeFighter is a sophisticated on-chain PvP battle system that combines game theory, cryptographic fairness, and Solana's high-performance blockchain. Players choose from crypto-native character archetypes and engage in strategic battles using commit-reveal mechanics to ensure fairness and prevent front-running

### 🎯 Key Features

- **⚡ Fully On-Chain**: All game logic, state, and randomness handled by Solana smart contracts
- **🎭 Crypto-Native Classes**:
  - **Shitposter**: Meme warfare specialist with viral attack patterns
  - **Builder**: Ship-fast developer with deployment-based abilities
  - **VC Chad**: Funding pressure expert with liquidity manipulation moves
- **🔒 Commit-Reveal Battle System**: Cryptographically fair gameplay preventing front-running
- **📈 Progressive Character System**: XP, leveling, and ability upgrades stored on-chain
- **⚖️ Configurable Game Balance**: Admin-controlled parameters via Config PDA
- **🌐 Full-Stack Implementation**: Rust/Anchor backend + TypeScript SDK + Next.js frontend

## 🏗️ Technical Architecture

### Smart Contract (Rust + Anchor)
```
programs/defighter/src/
├── lib.rs              # Program entrypoint & instruction handlers
├── state/              # Account structures (Player, Battle, Config PDAs)
├── logic/              # Battle resolution & damage calculation
├── instructions/       # Transaction handlers (create_player, commit_move, etc.)
└── events.rs          # On-chain event emissions
```

**Program ID (Devnet)**: `HGkRbNawHR3PbA2h1LgqtMNCj6jcrS14c86wDUvS3dTL`

### Frontend Stack
- **Web App**: Next.js 14 + TypeScript + Tailwind CSS
- **Wallet Integration**: Solana Wallet Adapter with multi-wallet support
- **State Management**: Zustand for client-side game state
- **SDK**: Custom TypeScript SDK for program interaction

### Key Technical Innovations

1. **Commit-Reveal Fairness**: Players commit hashed moves, then reveal simultaneously to prevent strategic advantage
2. **PDA-Based Architecture**: Uses Program Derived Addresses for deterministic account generation
3. **Configurable Balance System**: On-chain parameters allow real-time game balance updates
4. **Event-Driven Updates**: Smart contract events drive real-time UI updates

## 🚀 Quick Start

### Prerequisites
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (1.16+)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) (0.31.x)
- [Node.js](https://nodejs.org/) (18+)
- [Rust](https://rustup.rs/) (latest stable)

### Option 1: Web Interface (Recommended)
```bash
# Clone and setup
git clone https://github.com/your-username/defighter.git
cd defighter

# Install dependencies
npm install
cd web && npm install

# Start web app (connects to devnet by default)
npm run dev:devnet
```
Open [http://localhost:3000](http://localhost:3000) and connect your Phantom/Solflare wallet.

### Option 2: CLI Demo
```bash
# Build and deploy locally
solana-test-validator --reset --quiet &
anchor build && anchor deploy

# Run TypeScript demo
cd client/ts
npm install
npm run local-demo
```

### Option 3: Devnet Testing
```bash
# Set Solana to devnet
solana config set --url https://api.devnet.solana.com

# Ensure you have devnet SOL
solana airdrop 2

# Run against live devnet deployment
cd web
npm run dev:devnet
```

## 🎯 Game Mechanics

### Battle Flow
1. **Character Creation**: Choose class and customize abilities
2. **Battle Initiation**: Challenge opponent with configurable time limits
3. **Commit Phase**: Both players submit encrypted move commitments
4. **Reveal Phase**: Players reveal actual moves + salt for verification
5. **Resolution**: On-chain damage calculation and XP/level updates

### Character Classes & Moves

| Class | Basic Move | Special Move | Strategy |
|-------|------------|--------------|----------|
| **Shitposter** | Meme Bomb (100% hit) | Rug Pull Rumor (high-risk/reward) | Reliable damage vs gambling |
| **Builder** | Ship It (consistent) | Testnet Deploy (deployment gamble) | Steady progress vs big risks |
| **VC Chad** | Series A Cannon (funding pressure) | Exit Liquidity (market manipulation) | Pressure tactics vs timing |

## 🛠️ Development

### Project Structure
```
defighter/
├── programs/defighter/     # Anchor smart contract (Rust)
├── web/                   # Next.js frontend
├── client/ts/            # TypeScript SDK + CLI demo
├── docs/                 # Architecture & game design
└── target/               # Compiled artifacts
```

### Key Commands
```bash
# Smart contract
anchor build                    # Compile Rust program
anchor test                     # Run on-chain tests
anchor deploy --provider.cluster devnet  # Deploy to devnet

# Frontend
cd web && npm run dev          # Start development server
cd web && npm run build        # Production build

# CLI SDK
cd client/ts && npm run local-demo    # Full demo against local validator
```

### Testing
- **Unit Tests**: `anchor test` - Tests core game logic and edge cases
- **Integration Tests**: TypeScript client in `client/ts/src/demo.ts`
- **Manual Testing**: Web interface at `localhost:3000`

## 📊 Game Economics

- **Fair Battle Resolution**: Commit-reveal prevents information asymmetry
- **Progressive Character Growth**: On-chain XP and ability upgrades
- **Configurable Parameters**: Admin can adjust damage multipliers, XP rates
- **Future Token Economics**: Ready for tokenized rewards and staking

## 📋 Deployment Info

**Devnet Program**: `HGkRbNawHR3PbA2h1LgqtMNCj6jcrS14c86wDUvS3dTL`
- Fully deployed and functional on Solana devnet
- Get devnet SOL from [Solana faucet](https://faucet.solana.com/)

## 🔧 Configuration

Game balance parameters stored in on-chain Config PDA:
- Base damage values per class
- XP gain rates and level requirements
- Battle timeout settings
- Critical hit probabilities

## 📝 Smart Contract Security

- **Commit-Reveal Pattern**: Prevents front-running and MEV
- **PDA Validation**: Deterministic account derivation prevents account confusion
- **Overflow Protection**: All arithmetic uses checked operations
- **Access Control**: Admin functions properly gated

## 🔐 API Security & Privacy

**Secure RPC Proxy Implementation**: This project implements a server-side RPC proxy to protect sensitive API keys from client-side exposure.

### How It Works:
- **Client-Side**: Frontend makes requests to `/api/solana` (relative URL)
- **Server-Side Proxy**: Next.js API route adds Helius API key server-side
- **Hidden Keys**: API keys never appear in browser DevTools or network requests
- **WebSocket Safety**: Proper WebSocket endpoint handling prevents `ws://localhost` issues

### Environment Variables:
```bash
# Public (safe to expose)
NEXT_PUBLIC_SOLANA_RPC_URL=/api/solana

# Private (server-side only)
HELIUS_API_KEY=your_actual_key_here
RPC_UPSTREAM=https://devnet.helius-rpc.com
```

### Security Benefits:
- ✅ **No API Key Exposure**: Keys never sent to client
- ✅ **DevTools Safe**: Network tab shows only `/api/solana` requests
- ✅ **Production Ready**: Works identically in development and production
- ✅ **SSR Compatible**: Proper endpoint normalization for server-side rendering

## 🚀 Production Reliability Features

**Robust Transaction Handling**: The app includes several production-ready features for handling busy Solana networks:

### Extended Timeouts & Retry Logic:
- **3-minute transaction timeouts** (vs standard 30 seconds) for busy networks
- **Automatic blockhash retry** mechanism (up to 3 attempts) for expired blockhashes
- **Extended battle deadlines** (10 minutes per phase) to handle network congestion
- **Graceful WebSocket fallback** when real-time connections fail

### Network Resilience:
- **Confirmed blockhashes** for more stable transaction submission
- **Timing delays** to ensure blockhash validity before sending
- **Error-specific retry logic** for different failure types
- **Comprehensive logging** for debugging and monitoring

## 🚧 Development Notes

This project prioritizes **core blockchain functionality** over UI polish to demonstrate advanced Solana development skills:

**Current Implementation:**
- ✅ **Complex Smart Contract**: Multi-PDA architecture, commit-reveal mechanics, configurable game balance
- ✅ **Full TypeScript Integration**: Custom SDK, type-safe program interactions
- ✅ **Proven Concept**: Local demo shows complete battle system works end-to-end
- 🎨 **UI Expansion Planned**: Special attacks, battle animations, enhanced UX coming next

**Technical Depth Showcased:**
- Complex state management with multiple PDA types
- Cryptographic fairness mechanisms (commit-reveal)
- Real-time frontend integration with on-chain state
- Configurable on-chain parameters and game balance

## 📄 License

MIT License - Feel free to use this code as reference for your own Solana projects.

---

**Tech Stack**: Rust • Anchor • Solana • TypeScript • Next.js • Tailwind CSS • Web3.js

Built with ❤️ for the Solana ecosystem
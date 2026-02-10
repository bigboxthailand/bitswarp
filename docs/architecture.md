# BitSwarp Architecture

## Vision
To be the first AI-native decentralized exchange that provides a seamless, conversational trading experience across multiple chains.

## Component Details

### 1. The Brain (AI Gateway)
- **Role:** Natural Language Processing (NLP) of trading intents.
- **Tech:** LangChain + Custom Prompt Templates.
- **Output:** Structured trade actions.

### 2. The Muscle (Matching Engine)
- **Role:** Finding the best routes, managing liquidity pools, and order matching.
- **Tech:** Rust for low latency.

### 3. The Vault (Smart Contracts)
- **Role:** Non-custodial settlement of assets.
- **Tech:** Solidity (EVM) and Rust (Anchor).

## Security First
- No private keys stored on the server.
- All transactions signed by user wallets (Metamask, Phantom, etc.).
- Multi-signature for treasury and protocol upgrades.

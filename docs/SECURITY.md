# BitSwarp Security Architecture

Security is our top priority. BitSwarp implements a multi-layered security approach:

## 1. Smart Contract Security
- **Reentrancy Guard:** All withdrawal and swap functions are protected against reentrancy attacks.
- **Pausable (Circuit Breaker):** Admin can pause the protocol in case of emergencies.
- **Strict Access Control:** Only the owner can update the AI Executor or safety limits.
- **Transaction Limits:** `maxSwapAmount` is implemented at the contract level to prevent massive unauthorized swaps.

## 2. AI & API Safety
- **AI Intent Verification:** Every AI-extracted intent is cross-referenced with hard-coded safety limits (e.g., max trade size).
- **Rate Limiting:** Protects the API from DDoS and brute-force attacks.
- **Input Sanitization:** All user inputs are sanitized before being processed by the AI model.
- **CORS Protection:** API only accepts requests from trusted dashboard domains.

## 3. User & Wallet Security
- **Non-Custodial:** BitSwarp never stores user private keys.
- **Review Before Sign:** Every trade MUST be manually reviewed and signed by the user in their own wallet.
- **Transparent Simulation:** (In progress) Simulating transactions before signing to show expected outcome.

## 4. Operational Security
- **Managed AI Keys:** LLM API keys are stored as secure environment variables.
- **Multi-chain Monitoring:** Constant monitoring for irregular pool activities.

# BitSwarp 🦞⚡
**The First AI-Native Multi-Chain Decentralized Exchange**

BitSwarp is a high-performance, intelligent trading protocol designed for the agentic era. It bridges the gap between human intent and on-chain execution across EVM and Solana ecosystems.

---

## 🚀 Key Features

- **🧠 AI Intent Engine:** Trade using natural language. No more complex forms—just tell BitSwarp what you want to do.
- **🌐 Multi-Chain Support:** Seamlessly integrated with Ethereum (EVM/Monad) and Solana.
- **🛡️ Institutional Grade Security:** Non-custodial vaults with reentrancy protection, emergency circuit breakers, and AI safety guards.
- **⚡ Pro-Tier Execution:** Connected to Jupiter (Solana) and OpenOcean (EVM) for real-time best-price routing.
- **📊 Unified Dashboard:** A premium, real-time interface for asset management and portfolio tracking.

---

## 📂 Project Structure

- `ui/`: **Landing Page** built with Astro & Tailwind CSS for maximum SEO and performance.
- `app/`: **Trading Terminal** built with Vite, React, and Shadcn/UI for a smooth AI-native experience.
- `admin/`: **Command Center** for protocol governance and security management.
- `api/`: **Intelligent Gateway** powered by Bun & Elysia for ultra-low latency AI processing.
- `contracts/`: **Smart Contracts** written in Solidity (Foundry) and Rust (Anchor).

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Astro, React, Tailwind CSS 4.0, Framer Motion |
| **Backend** | Bun, ElysiaJS, OpenAI SDK |
| **Web3** | Wagmi, Viem, @solana/web3.js, Jupiter API |
| **Blockchain** | Solidity (EVM), Rust (Anchor/Solana) |

---

## 🏗️ Getting Started

### Prerequisites
- [Bun](https://bun.sh) (Recommended runtime)
- [Node.js](https://nodejs.org)
- [Foundry](https://book.getfoundry.sh/) (For EVM contracts)

### Installation
```bash
# Install dependencies for all modules
cd api && bun install
cd ../app && bun install
cd ../ui && bun install
cd ../admin && bun install
```

### Deployment
BitSwarp is designed to be deployed as a monorepo:
- **Frontend (ui, app, admin):** Optimized for [Vercel](https://vercel.com).
- **Backend (api):** Optimized for [Railway](https://railway.app) or Bun-native hosting.

---

## 🛡️ Security & Audits
BitSwarp implements strict access controls and safety limits. For detailed security architecture, please refer to [docs/SECURITY.md](./docs/SECURITY.md).

---

## 🤝 Contribution
Built with ❤️ by the **BitSwarp Protocol Team**. 2026.

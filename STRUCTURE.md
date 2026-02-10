# BitSwarp Project Structure

ความมุ่งหมายคือการสร้าง AI-Powered Multi-chain DEX ที่สมบูรณ์แบบและขยายผลได้ง่าย (Scalable) โดยแบ่งสัดส่วนการทำงานดังนี้:

## 📂 Directory Map

```text
BitSwarp/
├── ui/                 # 🌐 Landing Page (Astro + React + Tailwind)
│   ├── src/
│   │   ├── components/ # Shared UI components (Premium Look)
│   │   ├── layouts/    # Page layouts
│   │   └── pages/      # Static & SSR pages (SEO Optimized)
├── app/                # 🤖 AI Trading Dashboard (Vite + React + Shadcn/UI)
│   ├── src/
│   │   ├── components/ # Chat Interface, Charting, Trading Terminal
│   │   ├── hooks/      # Web3 (Wagmi/Solana-Wallet), API hooks
│   │   └── stores/     # State management (Zustand)
├── api/                # 🔌 Backend API Gateway (Bun + Elysia + Prisma)
│   ├── src/
│   │   ├── routes/     # Auth, User Profile, Trading History, Wallet Sync
│   │   ├── services/   # Business logic, AI Prompt Engineering
│   │   └── lib/        # Database, Blockchain RPC, AI Providers
├── engine/             # ⚡ High-Performance Matching Engine (Rust + Axum)
│   ├── src/
│   │   ├── matching/   # Order matching & Liquidity monitoring
│   │   ├── oracle/     # Multi-chain Price Feeds
│   │   └── main.rs
├── contracts/          # 📜 Smart Contracts (Multi-chain)
│   ├── evm/            # Monad / L2s (Foundry project)
│   └── solana/         # Solana (Anchor project)
├── docs/               # 📖 Documentation & Spec
│   ├── architecture.md
│   ├── api.md
│   └── roadmap.md
└── infrastructure/     # 🛠️ DevOps & Deployment
    ├── docker/
    └── scripts/        # Deployment & Testing scripts
```

---

## 🛠️ Technology Stack

### 1. Frontend & UI
- **Landing Page:** Astro (เพื่อความเร็วและ SEO)
- **Trading App:** Vite + React (เพื่อความไหลลื่นและ Interactive)
- **Styling:** Tailwind CSS + Shadcn/UI (Modern & Premium Aesthetics)
- **Web3 Interface:** Wagmi/Viem (EVM) และ @solana/web3.js

### 2. Backend & Trading Logic
- **API Layer:** Elysia (Bun) - มีความเร็วสูงมากและเข้ากับ TypeScript ได้ดีเยี่ยม
- **Execution Engine:** Rust (Axum + Tokyo) - ใช้สำหรับส่วนที่ต้องการความเร็วสูง (High-frequency data / Matching)
- **Database:** PostgreSQL (Prisma ORM)

### 3. Smart Contracts
- **EVM Layer:** Solidity 0.8.20+ (Foundry)
- **Solana Layer:** Rust (Anchor)

---

## 🧬 Data Flow (How it works)
1. **User Interaction:** ผู้ใช้ป้อนคำสั่งผ่าน AI Chat ใน `app/` (เช่น "Swap 0.1 ETH to USDC on Monad")
2. **AI Processing:** `api/` รับข้อความ -> ส่งให้ AI Model (LLM) แปลงเป็น JSON Command
3. **Execution Engine:** `engine/` ตรวจสอบสภาพคล่อง (Liquidity) และราคาที่ดีที่สุด
4. **On-chain Action:** ส่งคำสั่งไปยัง `contracts/` เพื่อทำรายการจริงผ่าน Wallet ของผู้ใช้
5. **Feedback:** แสดงสถานะการทำรายการกลับมายัง AI Chat

เจ้านายเห็นชอบกับโครงสร้างนี้ไหมครับ? หากตกลง ผมจะเริ่มวาง Base Code ของแต่ละส่วนตามลำดับความสำคัญครับ 🦞🤖

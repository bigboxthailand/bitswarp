# BitSwarp API Specification

**Version:** 0.1.0-alpha
**Main Site:** `https://bitswarp.com`
**AI Gateway:** `https://ai.bitswarp.com`
**Local API:** `http://localhost:3000/v1`

## Market Data
- `GET /market/price/:pair` - Get real-time pair price.

## Trading
- `POST /trade/limit` - Place a limit order.
  ```json
  {
    "pair": "BTC/USDC",
    "side": "buy",
    "price": 65000.5,
    "amount": 0.1
  }
  ```

## Program IDs
- **Solana:** `BitSwarp111111111111111111111111111111111`
- **EVM (Monad):** TBD (Deploying BitSwarpPool.sol)

<img width="1500" height="470" alt="vechain-mar3-main" src="https://github.com/user-attachments/assets/65334654-0a53-4360-ab6a-35eca59c712b" />
# veSave

## Architecture
- Frontend (React + Vite)
  - Located in `src/`, rendered through `src/main.tsx`.
  - Uses `@vechain/vechain-kit` for wallet connectivity and `@vechain/sdk-core` helpers.
  - Talks to backend through REST endpoints defined in `src/services`.
  - Environment: `.env` values prefixed with `VITE_` (e.g., `VITE_BACKEND_API_BASE`).
- Backend (Express API)
  - Lives in `backend/src`.
  - Exposes `/api` endpoints for wallet creation/deletion and bridge orchestration.
  - Holds in-memory wallet bundles and uses `ethers` + VeChain SDK utilities.
  - Loads configuration from the root `.env`.
- Shared contracts & config
  - Constants live in `src/config`.
  - Wallet logic for fallback/mock sessions resides in `src/hooks/useEphemeralWallet`.
  - Both layers share the same `package.json` scripts and dependencies from the repo root.

## Getting Started
```bash
# install dependencies once (frontend + backend)
npm install

# run the Vite frontend (http://localhost:5173 by default)
npm run dev

# in another terminal, start the backend API (http://localhost:4000)
npm run server
```

## App Overview
veSave is a VeChain-native DeFi experience that lets users move USDC from Ethereum (Sepolia) to VeChain testnet, swap that USDC to VET, and stake the resulting VET in Stargate. The current build already includes a working bridge flow across the two testnets.

## Builder Challenges
1. Add the USDC→VET swap via BetterSwap once the bridge completes.
2. Trigger Stargate staking automatically immediately after the swap succeeds.

## Community
Join the official VeChain developer Telegram to get support and collaborate with hundreds of active builders.

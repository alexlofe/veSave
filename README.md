# veSave - VeChain Technical Test

## Task 1: VeChain Kit Social Login

### Setup
```bash
npm install
cp .env.example .env
```

### Configure (optional for social login)
Add your credentials to `.env`:
```
VITE_PRIVY_APP_ID=your-privy-app-id
VITE_PRIVY_CLIENT_ID=your-privy-client-id
```

### Run
```bash
npm run dev
```
Open http://localhost:5173 and click "Connect Wallet" to see login options (Google, Email, Passkey).

### Key Files
- `src/components/VeChainKitProvider.tsx` - VeChain Kit + Privy configuration
- `src/main.tsx` - Provider wrapper

---

## Task 2: B3TR → VET Swap Contract

### Test
```bash
npm run test:contracts
```
Runs 15 tests covering deployment, swapping, slippage protection, and access control.

### Compile
```bash
npm run compile
```

### Deploy (requires private key in .env)
```bash
npx hardhat run scripts/deploy.cjs --network vechain_testnet
```

### Key Files
- `contracts/B3TRVetSwapper.sol` - Main swap contract with ReentrancyGuard
- `test/B3TRVetSwapper.test.cjs` - Test suite

### Mainnet Addresses
| Contract | Address |
|----------|---------|
| VeRocket Router | `0x576da7124C7bB65a692d95848276367e5a844d95` |
| B3TR Token | `0x5ef79995FE8a89e0812330E4378eB2660ceDe699` |

---

## Frontend Integration

The B3TR swap is integrated into the UI via:
- `src/services/b3trSwap.ts` - Contract ABI and helpers
- `src/hooks/useB3TRSwap.ts` - React hook for swap transactions
- `src/App.tsx` - "B3TR to VET Swap" UI section

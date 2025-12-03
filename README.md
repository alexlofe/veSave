# VeSave

VeChain Kit social login + B3TR swap contract.

## Setup

```bash
npm install
cp .env.example .env
# fill in your Privy/WalletConnect credentials
npm run dev
```

## Smart Contract

Swap B3TR → VET via VeRocket.

Mainnet addresses:
- Router: `0x576da7124C7bB65a692d95848276367e5a844d95`
- B3TR: `0x5ef79995FE8a89e0812330E4378eB2660ceDe699`

```bash
npm run test:contracts
npm run deploy:testnet
```

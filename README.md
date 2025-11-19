# VeSave Technical Test Submission

This submission details the completion of the technical test for the VeSave project, covering the integration of the VeChain DApp Kit for social login and the development of a Solidity smart contract for B3TR to VET swaps.

## Task 1: Integrate VeChain Kit for Social Login

The social login functionality has been integrated into the existing UI using the official `@vechain/dapp-kit-react` library, configured for the VeChain Testnet.

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Setup and Running

1. **Install dependencies:**

   ```bash
   npm install
   # Ensure the DApp Kit dependencies are installed
   npm install @vechain/dapp-kit-react @vechain/dapp-kit
   ```

2.  **Configuration (Privy App ID):**
    To enable social login (powered by Privy), you need a Privy App ID. If you do not provide one, the modal will only show standard wallet connection options (VeWorld, Sync2). Update `src/components/DAppKitProvider.tsx` with your App ID:

    ```tsx
    // src/components/DAppKitProvider.tsx
    // ...
    // privyAppId: 'YOUR_PRIVY_APP_ID',
    // ...
    ```

3.  **Run the application:**

    ```bash
    npm run dev
    # or
    yarn dev
    ```

4.  **Testing:**

      - Visit `http://localhost:5173` (Vite default port) or the port shown in your terminal.
      - Click the "Login" button.
      - The DApp Kit connection modal will appear.
      - Upon successful connection, the UI will display the connected account address and a "Logout" button.
      - Fee Delegation is enabled (`useDelegation={true}`), providing a gasless experience if the sponsor is available.

### Implementation Notes

  - **`src/components/DAppKitProvider.tsx`**: Created a component to wrap the application with `DAppKitProvider`.
  - **`src/main.tsx`**: Imported and used the `VeChainDAppKitProvider` to wrap the root `App` component.
  - **`src/App.tsx`**: Updated to use `useWalletModal` and `useWallet` from `@vechain/dapp-kit-react` to manage the connection status and social login flow.

## Task 2: Write a Simple Solidity Contract

A Solidity contract `B3TRVetSwapper.sol` has been created to facilitate B3TR to VET swaps.

### Contract Details

The contract assumes that BetterSwap utilizes the standard Uniswap V2 Router interface.

**Important Note:** The official BetterSwap Router address could not be located. **You must find the correct BetterSwap Router address (for Mainnet or Testnet) and provide it when deploying this contract.**

### Testing the Contract

You can use Hardhat or Remix to compile, deploy, and test the contract.

#### Prerequisites for Testing

  - Solidity development environment (e.g., Hardhat).
  - OpenZeppelin contracts library (`npm install @openzeppelin/contracts`).

#### Steps to Test

1.  **Compile:** Compile `B3TRVetSwapper.sol` using Solidity compiler version 0.8.20 or later.
2.  **Deploy:** Deploy the contract to the desired VeChain network, providing the BetterSwap Router address to the constructor.
3.  **Approve B3TR:** Before swapping, the user must approve the deployed `B3TRVetSwapper` contract address to spend their B3TR tokens. Call the `approve` function on the B3TR token contract.
4.  **Estimate Swap (Optional):** Call `getEstimatedVETOut` to get an estimated output amount.
5.  **Execute Swap:** Call the `swapB3TRForVET` function, providing the `amountIn`, `amountOutMin` (slippage protection), and `deadline`.

The contract will execute the swap on the DEX and send the resulting VET directly back to the caller's address.

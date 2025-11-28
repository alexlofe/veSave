'use client';

import { VeChainKitProvider } from "@vechain/vechain-kit";

export function VeChainKitProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <VeChainKitProvider
      // Network Configuration
      network={{
        type: "test", // "main" | "test" | "solo"
      }}
      
      // Fee Delegation
      feeDelegation={{
        delegatorUrl: "https://sponsor-testnet.vechain.energy/by/441",
        delegateAllTransactions: false, // Set to true to delegate all transactions
      }}
      
      // Login Methods Configuration
      loginMethods={[
        { method: "vechain", gridColumn: 4 },
        { method: "dappkit", gridColumn: 4 },
        { method: "ecosystem", gridColumn: 4 },
      ]}
      
      // DApp Kit Configuration
      dappKit={{
        allowedWallets: ["veworld"],
        walletConnectOptions: {
          projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
          metadata: {
            name: "veSave",
            description: "The best way to earn yield",
            url: typeof window !== "undefined" ? window.location.origin : "",
            icons: [],
          },
        },
      }}
      
      // UI Configuration
      darkMode={false}
      language="en"
      allowCustomTokens={false}
      
      // Login Modal UI Customization
      loginModalUI={{
        description: 'Welcome to veSave',
      }}
    >
      {children}
    </VeChainKitProvider>
  );
}

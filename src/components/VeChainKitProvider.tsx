import React from 'react';
import { VeChainKitProvider as VeChainKitProviderBase } from '@vechain/vechain-kit';

// Environment variables for configuration
const privyAppId = import.meta.env.VITE_PRIVY_APP_ID ?? '';
const privyClientId = import.meta.env.VITE_PRIVY_CLIENT_ID ?? '';
const walletConnectProjectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID ?? '';
const delegatorUrl = import.meta.env.VITE_FEE_DELEGATOR_URL ?? '';

// Determine network from env or default to testnet
const nodeUrl = import.meta.env.VITE_VECHAIN_NODE_URL ?? 'https://testnet.vechain.org/';
const networkType = nodeUrl.includes('mainnet') ? 'main' : 'test';

export function VeChainKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <VeChainKitProviderBase
      // Network configuration (required)
      network={{
        type: networkType as 'main' | 'test',
        nodeUrl: nodeUrl,
      }}

      // DappKit configuration (required)
      dappKit={{
        walletConnectOptions: walletConnectProjectId ? {
          projectId: walletConnectProjectId,
          metadata: {
            name: 'veSave',
            description: 'The easiest way to save and earn on the VeChain blockchain.',
            url: typeof window !== 'undefined' ? window.location.origin : '',
            icons: ['https://avatars.githubusercontent.com/u/37784886'],
          },
        } : undefined,
        usePersistence: true,
      }}

      // Privy configuration for social login (email, Google, passkey)
      // Only configure if Privy app ID is provided
      privy={privyAppId ? {
        appId: privyAppId,
        clientId: privyClientId,
        loginMethods: ['google', 'email'],
        appearance: {
          accentColor: '#4a90d9',
          loginMessage: 'Connect to veSave',
          logo: 'https://avatars.githubusercontent.com/u/37784886',
        },
        embeddedWallets: {
          createOnLogin: 'all-users',
        },
      } : undefined}

      // Fee delegation configuration (mandatory for social login)
      feeDelegation={delegatorUrl ? {
        delegatorUrl,
        delegateAllTransactions: true,
      } : undefined}

      // Login modal UI configuration
      loginModalUI={{
        logo: 'https://avatars.githubusercontent.com/u/37784886',
        description: 'Connect to start saving with veSave',
      }}

      // Available login methods with layout configuration
      loginMethods={[
        { method: 'vechain', gridColumn: 4 },
        { method: 'dappkit', gridColumn: 4 },
        ...(privyAppId ? [
          { method: 'email' as const, gridColumn: 2 },
          { method: 'google' as const, gridColumn: 2 },
          { method: 'passkey' as const, gridColumn: 2 },
        ] : []),
      ]}

      // Allow custom tokens for display
      allowCustomTokens={true}
    >
      {children}
    </VeChainKitProviderBase>
  );
}

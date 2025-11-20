import React from 'react';
import { DAppKitProvider } from '@vechain/dapp-kit-react';

export function VeChainDAppKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <DAppKitProvider
      node="https://testnet.vechain.org/"
      usePersistence={true}
      walletConnectOptions={{
        projectId: '75220875292977', 
        metadata: {
          name: 'veSave',
          description: 'The easiest way to save and earn on the VeChain blockchain.',
          url: typeof window !== 'undefined' ? window.location.origin : '',
          icons: ['https://avatars.githubusercontent.com/u/37784886'],
        },
      }}
    >
      {children}
    </DAppKitProvider>
  );
}
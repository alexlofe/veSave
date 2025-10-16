import type { ReactNode } from 'react'
import { VeChainKitProvider } from '@vechain/vechain-kit'

import { VECHAIN_NODE_URL } from '../config/constants'

interface VeChainKitProviderWrapperProps {
  children: ReactNode
}

const loginMethods = [
  { method: 'vechain', gridColumn: 4 },
  { method: 'dappkit', gridColumn: 4 },
] as const

const walletConnectProjectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID ?? ''

const metadata = {
  name: 'veSave',
  description: 'Bridge demo showcasing VeChainThor tooling.',
  url: typeof window !== 'undefined' ? window.location.origin : '',
  icons: ['https://vechainkit.vechain.org/kit-preview.png'],
}

export function VeChainKitProviderWrapper({ children }: VeChainKitProviderWrapperProps) {
  const walletConnectOptions = walletConnectProjectId
    ? {
        projectId: walletConnectProjectId,
        metadata,
      }
    : undefined

  return (
    <VeChainKitProvider
      feeDelegation={{
        delegatorUrl: 'https://sponsor-testnet.vechain.energy/by/909',
        delegateAllTransactions: false,
      }}
      loginMethods={[...loginMethods]}
      dappKit={{
        allowedWallets: ['veworld'],
        ...(walletConnectOptions ? { walletConnectOptions } : {}),
      }}
      darkMode={false}
      language="en"
      network={{
        type: 'test',
        nodeUrl: VECHAIN_NODE_URL,
      }}
    >
      {children}
    </VeChainKitProvider>
  )
}

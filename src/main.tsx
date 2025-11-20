import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.tsx'
import { VeChainDAppKitProvider } from './components/DAppKitProvider.tsx'
import './style.css'

const walletConnectProjectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID ?? ''
const globalProcess = (globalThis as Record<string, unknown>).process as {
  env?: Record<string, string | undefined>
} | undefined

;(globalThis as Record<string, unknown>).process = {
  ...(globalProcess ?? {}),
  env: {
    ...(globalProcess?.env ?? {}),
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: walletConnectProjectId,
  },
}

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <VeChainDAppKitProvider>
      <App />
    </VeChainDAppKitProvider>
  </React.StrictMode>,
)

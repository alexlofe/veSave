import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.tsx'
import { VeChainKitProviderWrapper } from './providers/VeChainKitProvider.tsx'
import './style.css'

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <VeChainKitProviderWrapper>
      <App />
    </VeChainKitProviderWrapper>
  </React.StrictMode>,
)

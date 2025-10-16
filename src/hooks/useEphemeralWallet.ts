import { useCallback, useMemo, useState } from 'react'

import { BACKEND_API_BASE } from '../config/constants'

export interface WalletSession {
  sessionId: string
  ethereum: { address: string }
  vechain: { address: string }
}

const sanitizeBase = (base: string) => base.replace(/\/$/, '')

export const useEphemeralWallet = () => {
  const [wallet, setWallet] = useState<WalletSession | null>(null)

  const createWallet = useCallback(async () => {
    if (!BACKEND_API_BASE) {
      throw new Error('Backend base URL is not configured. Set VITE_BACKEND_API_BASE.')
    }

    const endpoint = `${sanitizeBase(BACKEND_API_BASE)}/wallets`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      let errorMessage = 'Failed to create wallet.'
      try {
        const payload = await response.json()
        if (payload?.error) errorMessage = payload.error
      } catch {
        // ignore JSON parse error
      }
      throw new Error(errorMessage)
    }

    const walletSession = (await response.json()) as WalletSession
    setWallet(walletSession)
    return walletSession
  }, [])

  const resetWallet = useCallback(async () => {
    if (wallet?.sessionId && BACKEND_API_BASE) {
      const endpoint = `${sanitizeBase(BACKEND_API_BASE)}/wallets/${wallet.sessionId}`
      try {
        await fetch(endpoint, { method: 'DELETE' })
      } catch (error) {
        console.warn('Failed to delete wallet session from backend', error)
      }
    }
    setWallet(null)
  }, [wallet])

  const session = useMemo(() => wallet, [wallet])

  return {
    wallet: session,
    createWallet,
    resetWallet,
  }
}

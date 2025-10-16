import { useCallback, useMemo, useState } from 'react'

import { BACKEND_API_BASE } from '../config/constants'

export interface WalletSession {
  sessionId: string
  ethereum: { address: string }
  vechain: { address: string }
}

const sanitizeBase = (base: string) => base.replace(/\/$/, '')

const getRandomBytes = (size: number) => {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    return window.crypto.getRandomValues(new Uint8Array(size))
  }
  const bytes = new Uint8Array(size)
  for (let index = 0; index < size; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256)
  }
  return bytes
}

const randomHex = (length: number) => {
  const bytes = getRandomBytes(Math.ceil(length / 2))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

const buildMockWalletSession = (): WalletSession => ({
  sessionId: `mock-session-${Date.now().toString(16)}`,
  ethereum: { address: `0x${randomHex(40)}` },
  vechain: { address: `0x${randomHex(40)}` },
})

export const useEphemeralWallet = () => {
  const [wallet, setWallet] = useState<WalletSession | null>(null)

  const createWallet = useCallback(async () => {
    const trimmedBase = BACKEND_API_BASE.trim()
    const fallback = () => {
      console.warn('Using mock wallet session. Backend wallet endpoint unavailable.')
      const session = buildMockWalletSession()
      setWallet(session)
      return session
    }

    if (!trimmedBase) {
      return fallback()
    }

    try {
      const endpoint = `${sanitizeBase(trimmedBase)}/wallets`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        let errorMessage = `Failed to create wallet (HTTP ${response.status}).`
        try {
          const payload = await response.json()
          if (payload?.error) errorMessage = payload.error
        } catch {
          // ignore JSON parse error
        }
        console.warn(errorMessage)
        return fallback()
      }

      const walletSession = (await response.json()) as WalletSession
      setWallet(walletSession)
      return walletSession
    } catch (networkError) {
      console.warn('Wallet API unreachable. Falling back to mock wallet.', networkError)
      return fallback()
    }
  }, [])

  const resetWallet = useCallback(async () => {
    const trimmedBase = BACKEND_API_BASE.trim()
    if (wallet?.sessionId && trimmedBase) {
      const endpoint = `${sanitizeBase(trimmedBase)}/wallets/${wallet.sessionId}`
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

import { randomUUID } from 'crypto'
import { Wallet as EthersWallet } from 'ethers'

const walletStore = new Map()

export const createWalletBundle = () => {
  const sessionId = randomUUID()
  const ethereumWallet = EthersWallet.createRandom()
  const vechainWallet = EthersWallet.createRandom()

  walletStore.set(sessionId, {
    sessionId,
    createdAt: Date.now(),
    ethereum: {
      address: ethereumWallet.address,
      privateKey: ethereumWallet.privateKey,
    },
    vechain: {
      address: vechainWallet.address,
      privateKey: vechainWallet.privateKey,
    },
  })

  return {
    sessionId,
    ethereum: { address: ethereumWallet.address },
    vechain: { address: vechainWallet.address },
  }
}

export const getWalletBundle = (sessionId) => walletStore.get(sessionId) ?? null

export const deleteWalletBundle = (sessionId) => walletStore.delete(sessionId)

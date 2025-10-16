import { useCallback, useMemo, useState } from 'react'

import {
  SEPOLIA_USDC_ADDRESS,
  VECHAIN_TESTNET_USDC_ADDRESS,
  WANBRIDGE_FROM_CHAIN,
  WANBRIDGE_PARTNER,
  WANBRIDGE_TO_CHAIN,
} from '../config/constants'
import { convertUsdcToVet } from '../services/conversion'
import type { ConversionResponse } from '../services/conversion'
import { requestStargateStake } from '../services/stargate'
import type { StargateStakeResponse } from '../services/stargate'
import { submitWanBridgeTransfer } from '../services/wanBridge'
import type { WanBridgeTransferResponse } from '../services/wanBridge'
import type { WalletSession } from './useEphemeralWallet'

type StepStatus = 'idle' | 'pending' | 'success' | 'error'

export interface WorkflowStatuses {
  bridge: StepStatus
  swap: StepStatus
  stake: StepStatus
}

const INITIAL_STATUS: WorkflowStatuses = {
  bridge: 'idle',
  swap: 'idle',
  stake: 'idle',
}

export interface WorkflowParams {
  sessionId: string
  usdcAmount: number
  ethereumAddress: string
  vechainAddress: string
  slippageBps?: number
}

interface WorkflowInput {
  usdcAmount: number
  slippageBps?: number
}

export const useBridgeWorkflow = (walletSession: WalletSession | null) => {
  const [statuses, setStatuses] = useState<WorkflowStatuses>(INITIAL_STATUS)
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const [lastSwap, setLastSwap] = useState<ConversionResponse | null>(null)
  const [lastBridge, setLastBridge] = useState<WanBridgeTransferResponse | null>(null)
  const [lastStake, setLastStake] = useState<StargateStakeResponse | null>(null)

  const resetWorkflow = useCallback(() => {
    setStatuses(INITIAL_STATUS)
    setIsRunning(false)
    setError(null)
    setLastSwap(null)
    setLastBridge(null)
    setLastStake(null)
  }, [])

  const ensureWalletSession = useCallback(() => {
    if (!walletSession) {
      throw new Error('Create a deposit wallet before running the workflow.')
    }
    return walletSession
  }, [walletSession])

  const ensureEthereumWallet = useCallback(
    (address: string) => {
      const session = ensureWalletSession()
      const expected = session.ethereum.address
      if (expected.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Ethereum wallet mismatch between workflow and session wallet.')
      }
    },
    [ensureWalletSession],
  )

  const ensureVeChainWallet = useCallback(
    (address: string) => {
      const session = ensureWalletSession()
      const expected = session.vechain.address
      if (expected.toLowerCase() !== address.toLowerCase()) {
        throw new Error('VeChain wallet mismatch between workflow and session wallet.')
      }
    },
    [ensureWalletSession],
  )

  const createBridgePayload = useCallback(
    (params: WorkflowParams) => ({
      fromChain: WANBRIDGE_FROM_CHAIN,
      toChain: WANBRIDGE_TO_CHAIN,
      fromAccount: params.ethereumAddress,
      toAccount: params.vechainAddress,
      amount: params.usdcAmount.toString(),
      fromToken: SEPOLIA_USDC_ADDRESS,
      toToken: VECHAIN_TESTNET_USDC_ADDRESS,
      partner: WANBRIDGE_PARTNER || undefined,
    }),
    [
      SEPOLIA_USDC_ADDRESS,
      VECHAIN_TESTNET_USDC_ADDRESS,
      WANBRIDGE_FROM_CHAIN,
      WANBRIDGE_PARTNER,
      WANBRIDGE_TO_CHAIN,
    ],
  )

  const runSwap = useCallback(
    async (params: WorkflowParams) => {
      ensureVeChainWallet(params.vechainAddress)
      setStatuses((previous) => ({ ...previous, swap: 'pending' }))
      try {
        const swapResult = await convertUsdcToVet({
          sessionId: params.sessionId,
          usdcAmount: params.usdcAmount,
          depositAddress: params.vechainAddress,
          slippageBps: params.slippageBps,
        })
        setLastSwap(swapResult)
        setStatuses((previous) => ({ ...previous, swap: 'success' }))
        return swapResult
      } catch (swapError) {
        const reason =
          swapError instanceof Error ? swapError.message : 'USDC to VET swap failed.'
        setError(reason)
        setStatuses((previous) => ({ ...previous, swap: 'error' }))
        throw swapError
      }
    },
    [ensureVeChainWallet],
  )

  const runBridge = useCallback(
    async (params: WorkflowParams) => {
      ensureEthereumWallet(params.ethereumAddress)
      ensureVeChainWallet(params.vechainAddress)
      setStatuses((previous) => ({ ...previous, bridge: 'pending' }))
      try {
        const response = await submitWanBridgeTransfer({
          sessionId: params.sessionId,
          payload: createBridgePayload(params),
        })
        setLastBridge(response)
        setStatuses((previous) => ({ ...previous, bridge: 'success' }))
        return response
      } catch (bridgeError) {
        const reason =
          bridgeError instanceof Error ? bridgeError.message : 'WanBridge transfer failed.'
        setError(reason)
        setStatuses((previous) => ({ ...previous, bridge: 'error' }))
        throw bridgeError
      }
    },
    [createBridgePayload, ensureEthereumWallet, ensureVeChainWallet],
  )

  const runStake = useCallback(
    async (params: WorkflowParams, vetAmount: string) => {
      ensureVeChainWallet(params.vechainAddress)
      setStatuses((previous) => ({ ...previous, stake: 'pending' }))
      try {
        const response = await requestStargateStake({
          sessionId: params.sessionId,
          vetAmount,
          depositAddress: params.vechainAddress,
        })
        setLastStake(response)
        setStatuses((previous) => ({ ...previous, stake: 'success' }))
        return response
      } catch (stakeError) {
        const reason =
          stakeError instanceof Error ? stakeError.message : 'Stargate staking failed.'
        setError(reason)
        setStatuses((previous) => ({ ...previous, stake: 'error' }))
        throw stakeError
      }
    },
    [ensureVeChainWallet],
  )

  const executeFullFlow = useCallback(
    async (input: WorkflowInput) => {
      const session = ensureWalletSession()
      const params: WorkflowParams = {
        sessionId: session.sessionId,
        ethereumAddress: session.ethereum.address,
        vechainAddress: session.vechain.address,
        usdcAmount: input.usdcAmount,
        slippageBps: input.slippageBps,
      }

      if (params.usdcAmount <= 0) {
        throw new Error('Provide a positive USDC amount to start the workflow.')
      }

      resetWorkflow()
      setIsRunning(true)
      try {
        await runBridge(params)
        const swapResult = await runSwap(params)
        return await runStake(params, swapResult.vetAmount)
      } finally {
        setIsRunning(false)
      }
    },
    [ensureWalletSession, resetWorkflow, runBridge, runSwap, runStake],
  )

  const hydrateStatuses = useMemo(() => statuses, [statuses])

  return {
    statuses: hydrateStatuses,
    isRunning,
    error,
    executeFullFlow,
    resetWorkflow,
    lastSwap,
    lastBridge,
    lastStake,
  }
}

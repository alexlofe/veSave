import { useState } from 'react'

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
  const [statuses, setStatuses] = useState<WorkflowStatuses>({ ...INITIAL_STATUS })
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const [lastSwap, setLastSwap] = useState<ConversionResponse | null>(null)
  const [lastBridge, setLastBridge] = useState<WanBridgeTransferResponse | null>(null)
  const [lastStake, setLastStake] = useState<StargateStakeResponse | null>(null)

  const resetWorkflow = () => {
    setStatuses({ ...INITIAL_STATUS })
    setIsRunning(false)
    setError(null)
    setLastSwap(null)
    setLastBridge(null)
    setLastStake(null)
  }

  const requireSession = (): WalletSession => {
    if (!walletSession) {
      throw new Error('Create a deposit wallet before running the workflow.')
    }
    return walletSession
  }

  const expectWalletMatch = (expected: string, provided: string, label: string) => {
    if (expected.toLowerCase() !== provided.toLowerCase()) {
      throw new Error(`${label} mismatch between workflow and session wallet.`)
    }
  }

  const setStepStatus = (step: keyof WorkflowStatuses, status: StepStatus) => {
    setStatuses((current) => ({ ...current, [step]: status }))
  }

  const runStep = async <T>(
    step: keyof WorkflowStatuses,
    action: () => Promise<T>,
    fallbackMessage: string,
  ): Promise<T> => {
    setError(null)
    setStepStatus(step, 'pending')
    try {
      const result = await action()
      setStepStatus(step, 'success')
      return result
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : fallbackMessage
      setError(message)
      setStepStatus(step, 'error')
      throw cause
    }
  }

  const createBridgePayload = (params: WorkflowParams) => ({
    fromChain: WANBRIDGE_FROM_CHAIN,
    toChain: WANBRIDGE_TO_CHAIN,
    fromAccount: params.ethereumAddress,
    toAccount: params.vechainAddress,
    amount: params.usdcAmount.toString(),
    fromToken: SEPOLIA_USDC_ADDRESS,
    toToken: VECHAIN_TESTNET_USDC_ADDRESS,
    partner: WANBRIDGE_PARTNER || undefined,
  })

  const runSwap = (params: WorkflowParams) =>
    runStep(
      'swap',
      async () => {
        const session = requireSession()
        expectWalletMatch(session.vechain.address, params.vechainAddress, 'VeChain wallet')
        const swapResult = await convertUsdcToVet({
          sessionId: params.sessionId,
          usdcAmount: params.usdcAmount,
          depositAddress: params.vechainAddress,
          slippageBps: params.slippageBps,
        })
        setLastSwap(swapResult)
        return swapResult
      },
      'USDC to VET swap failed.',
    )

  const runBridge = (params: WorkflowParams) =>
    runStep(
      'bridge',
      async () => {
        const session = requireSession()
        expectWalletMatch(session.ethereum.address, params.ethereumAddress, 'Ethereum wallet')
        expectWalletMatch(session.vechain.address, params.vechainAddress, 'VeChain wallet')
        const response = await submitWanBridgeTransfer({
          sessionId: params.sessionId,
          payload: createBridgePayload(params),
        })
        setLastBridge(response)
        return response
      },
      'WanBridge transfer failed.',
    )

  const runStake = (params: WorkflowParams, vetAmount: string) =>
    runStep(
      'stake',
      async () => {
        const session = requireSession()
        expectWalletMatch(session.vechain.address, params.vechainAddress, 'VeChain wallet')
        const response = await requestStargateStake({
          sessionId: params.sessionId,
          vetAmount,
          depositAddress: params.vechainAddress,
        })
        setLastStake(response)
        return response
      },
      'Stargate staking failed.',
    )

  const executeFullFlow = async (input: WorkflowInput) => {
    const session = requireSession()
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
  }

  return {
    statuses,
    isRunning,
    error,
    executeFullFlow,
    resetWorkflow,
    lastSwap,
    lastBridge,
    lastStake,
  }
}

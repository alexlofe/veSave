import axios from 'axios'

import {
  BACKEND_API_BASE,
  WANBRIDGE_STATUS_BASE,
} from '../config/constants'

export interface WanBridgeTransferParams {
  fromChain: string
  toChain: string
  fromAccount: string
  toAccount: string
  amount: string
  fromToken: string
  toToken: string
  partner?: string
}

export interface WanBridgeTransferRequest {
  sessionId: string
  payload: WanBridgeTransferParams
}

export interface WanBridgeTransferResponse {
  taskId: string | null
  txHash?: string
}

export interface WanBridgeTransferStatus {
  status: 'pending' | 'confirming' | 'completed' | 'failed'
  txHash?: string
  reason?: string
}

const BACKEND_CREATE_PATH = '/bridge/create'
const BACKEND_STATUS_PATH = '/bridge/status'

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '')

const resolveEndpoint = (base: string, path: string) => `${trimTrailingSlash(base)}${path}`

export const submitWanBridgeTransfer = async (
  request: WanBridgeTransferRequest,
): Promise<WanBridgeTransferResponse> => {
  if (!BACKEND_API_BASE) {
    throw new Error('Backend base URL missing. Configure VITE_BACKEND_API_BASE to enable bridging.')
  }

  const endpoint = resolveEndpoint(BACKEND_API_BASE, BACKEND_CREATE_PATH)
  const { data } = await axios.post(endpoint, request)
  return data as WanBridgeTransferResponse
}

export const fetchWanBridgeStatus = async (taskId: string): Promise<WanBridgeTransferStatus> => {
  const endpoint = BACKEND_API_BASE
    ? resolveEndpoint(BACKEND_API_BASE, BACKEND_STATUS_PATH)
    : WANBRIDGE_STATUS_BASE
      ? resolveEndpoint(WANBRIDGE_STATUS_BASE, `/${taskId}`)
      : null

  if (!endpoint) {
    console.warn('WanBridge base URL missing. Returning mock status.')
    return {
      status: 'completed',
      txHash: `0xmock${taskId.slice(-8)}`,
    }
  }

  if (BACKEND_API_BASE) {
    const { data } = await axios.post(endpoint, { taskId })
    return data as WanBridgeTransferStatus
  }

  const { data } = await axios.get(endpoint)
  return data as WanBridgeTransferStatus
}

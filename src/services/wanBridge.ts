import axios from 'axios'

import { BACKEND_API_BASE, WANBRIDGE_STATUS_BASE } from '../config/constants'

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

const BRIDGE_CREATE_PATH = '/bridge/create'
const BRIDGE_STATUS_PATH = '/bridge/status'

const joinUrl = (base: string, path: string) => `${base.replace(/\/+$/, '')}${path}`

const buildMockStatus = (taskId: string): WanBridgeTransferStatus => ({
  status: 'completed',
  txHash: `0xmock${taskId.slice(-8)}`,
})

export const submitWanBridgeTransfer = async (
  request: WanBridgeTransferRequest,
): Promise<WanBridgeTransferResponse> => {
  const backendBase = BACKEND_API_BASE?.trim()
  if (!backendBase) {
    throw new Error('Set VITE_BACKEND_API_BASE to enable WanBridge transfers.')
  }

  const endpoint = joinUrl(backendBase, BRIDGE_CREATE_PATH)
  const { data } = await axios.post<WanBridgeTransferResponse>(endpoint, request)
  return data
}

export const fetchWanBridgeStatus = async (taskId: string): Promise<WanBridgeTransferStatus> => {
  const backendBase = BACKEND_API_BASE?.trim()
  if (backendBase) {
    const endpoint = joinUrl(backendBase, BRIDGE_STATUS_PATH)
    const { data } = await axios.post<WanBridgeTransferStatus>(endpoint, { taskId })
    return data
  }

  const statusBase = WANBRIDGE_STATUS_BASE?.trim()
  if (!statusBase) {
    console.warn('WanBridge status base missing. Returning mock status response.')
    return buildMockStatus(taskId)
  }

  const endpoint = joinUrl(statusBase, `/${taskId}`)
  const { data } = await axios.get<WanBridgeTransferStatus>(endpoint)
  return data
}

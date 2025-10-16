import axios from 'axios'

import { BACKEND_API_BASE, STARGATE_ROUTER_ADDRESS } from '../config/constants'

export interface StargateStakeParams {
  sessionId?: string
  vetAmount: string
  depositAddress: string
  dstChainId?: number
  poolId?: number
}

export interface StargateStakeResponse {
  txHash: string
  routerAddress: string
}

const DEFAULT_STARGATE_ROUTE = '/stargate/stake'

export const requestStargateStake = async (
  params: StargateStakeParams,
): Promise<StargateStakeResponse> => {
  const buildMockResponse = (): StargateStakeResponse => ({
    txHash: `0xmockStake${Date.now().toString(16)}`,
    routerAddress: STARGATE_ROUTER_ADDRESS,
  })

  if (!BACKEND_API_BASE) {
    console.warn('Backend base missing. Returning mock Stargate stake response.')
    return buildMockResponse()
  }

  const endpoint = `${BACKEND_API_BASE}${DEFAULT_STARGATE_ROUTE}`
  try {
    const { data } = await axios.post(endpoint, params)
    return data as StargateStakeResponse
  } catch (error) {
    console.warn('Stargate stake proxy failed. Falling back to mock response.', error)
    return buildMockResponse()
  }
}

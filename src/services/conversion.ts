import axios from 'axios'

import { BACKEND_API_BASE, VECHAIN_NATIVE_TOKEN, VECHAIN_TESTNET_USDC_ADDRESS } from '../config/constants'

export interface ConversionParams {
  sessionId?: string
  usdcAmount: number
  depositAddress: string
  slippageBps?: number
}

export interface ConversionResponse {
  txHash: string
  vetAmount: string
  minimumReceived: string
  quoteId?: string
  usdcToken: string
  vetToken: string
}

const DEFAULT_CONVERSION_ROUTE = '/conversion/usdc-to-vet'

const buildMockConversion = (params: ConversionParams): ConversionResponse => {
  const vetAmount = (params.usdcAmount * 0.95).toFixed(6)
  return {
    txHash: `0xmockSwap${Date.now().toString(16)}`,
    vetAmount,
    minimumReceived: vetAmount,
    quoteId: `mock-quote-${Date.now()}`,
    usdcToken: VECHAIN_TESTNET_USDC_ADDRESS,
    vetToken: VECHAIN_NATIVE_TOKEN,
  }
}

export const convertUsdcToVet = async (
  params: ConversionParams,
): Promise<ConversionResponse> => {
  if (!BACKEND_API_BASE) {
    console.warn('Backend base missing. Returning mock conversion response.')
    return buildMockConversion(params)
  }

  const endpoint = `${BACKEND_API_BASE}${DEFAULT_CONVERSION_ROUTE}`

  try {
    const { data } = await axios.post(endpoint, params)
    return data as ConversionResponse
  } catch (error) {
    console.warn('Backend conversion failed, falling back to mock response.', error)
    return buildMockConversion(params)
  }
}

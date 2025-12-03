/**
 * B3TR to VET Swap Service
 *
 * This service provides functions to interact with the B3TRVetSwapper contract
 * deployed on VeChain. It enables swapping B3TR tokens for native VET using
 * the VeRocket DEX (Uniswap V2 compatible).
 */

import {
  B3TR_TOKEN_MAINNET,
  B3TR_TOKEN_TESTNET,
  getCurrentNetwork,
  type NetworkType
} from '../config/addresses'

// B3TRVetSwapper Contract ABI - only the functions we need
export const B3TR_VET_SWAPPER_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' }
    ],
    name: 'swapB3TRForVET',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amountInB3TR', type: 'uint256' }],
    name: 'getEstimatedVETOut',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'B3TR_ADDRESS',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'WVET_ADDRESS',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'router',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

// ERC20 ABI for B3TR token approval
export const ERC20_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

// Contract addresses for B3TRVetSwapper (to be set after deployment)
export const B3TR_VET_SWAPPER_MAINNET = import.meta.env.VITE_B3TR_SWAPPER_MAINNET ?? ''
export const B3TR_VET_SWAPPER_TESTNET = import.meta.env.VITE_B3TR_SWAPPER_TESTNET ?? ''

/**
 * Get the B3TRVetSwapper contract address for the current network
 */
export function getSwapperAddress(network?: NetworkType): string {
  const currentNetwork = network ?? getCurrentNetwork()
  return currentNetwork === 'mainnet' ? B3TR_VET_SWAPPER_MAINNET : B3TR_VET_SWAPPER_TESTNET
}

/**
 * Get the B3TR token address for the current network
 */
export function getB3TRAddress(network?: NetworkType): string {
  const currentNetwork = network ?? getCurrentNetwork()
  return currentNetwork === 'mainnet' ? B3TR_TOKEN_MAINNET : B3TR_TOKEN_TESTNET
}

/**
 * Parameters for swapping B3TR to VET
 */
export interface SwapB3TRParams {
  /** Amount of B3TR to swap (in wei/smallest unit) */
  amountIn: bigint
  /** Minimum amount of VET to receive (slippage protection) */
  amountOutMin: bigint
  /** Unix timestamp deadline for the swap */
  deadline: bigint
}

/**
 * Response from a B3TR to VET swap
 */
export interface SwapB3TRResponse {
  /** Transaction hash */
  txHash: string
  /** Amount of B3TR swapped */
  amountIn: string
  /** Estimated VET received */
  estimatedVetOut: string
}

/**
 * Calculate the minimum output amount with slippage protection
 * @param estimatedOutput - The estimated output amount
 * @param slippageBps - Slippage tolerance in basis points (100 = 1%)
 */
export function calculateMinOutput(estimatedOutput: bigint, slippageBps: number = 100): bigint {
  const slippageFactor = BigInt(10000 - slippageBps)
  return (estimatedOutput * slippageFactor) / BigInt(10000)
}

/**
 * Get the deadline timestamp (current time + minutes)
 * @param minutes - Number of minutes until deadline (default: 20)
 */
export function getDeadline(minutes: number = 20): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + minutes * 60)
}

/**
 * Format B3TR amount from wei to human-readable string
 * @param amountWei - Amount in wei (18 decimals)
 * @param decimals - Number of decimal places to show
 */
export function formatB3TRAmount(amountWei: bigint, decimals: number = 4): string {
  const divisor = BigInt(10 ** 18)
  const whole = amountWei / divisor
  const fraction = amountWei % divisor
  const fractionStr = fraction.toString().padStart(18, '0').slice(0, decimals)
  return `${whole}.${fractionStr}`
}

/**
 * Parse B3TR amount from human-readable string to wei
 * @param amount - Human-readable amount (e.g., "100.5")
 */
export function parseB3TRAmount(amount: string): bigint {
  const [whole, fraction = ''] = amount.split('.')
  const paddedFraction = fraction.padEnd(18, '0').slice(0, 18)
  return BigInt(whole + paddedFraction)
}

/**
 * Build the contract call data for swapB3TRForVET
 * This can be used with VeChain SDK or VeChainKit to execute the swap
 */
export function buildSwapCallData(params: SwapB3TRParams): {
  to: string
  data: string
  value: string
} {
  const swapperAddress = getSwapperAddress()

  if (!swapperAddress) {
    throw new Error('B3TRVetSwapper contract address not configured')
  }

  // Function selector for swapB3TRForVET(uint256,uint256,uint256)
  const functionSelector = '0x63ee1708'

  // Encode parameters (each uint256 is 32 bytes, padded)
  const amountInHex = params.amountIn.toString(16).padStart(64, '0')
  const amountOutMinHex = params.amountOutMin.toString(16).padStart(64, '0')
  const deadlineHex = params.deadline.toString(16).padStart(64, '0')

  const data = functionSelector + amountInHex + amountOutMinHex + deadlineHex

  return {
    to: swapperAddress,
    data,
    value: '0x0'
  }
}

/**
 * Build the contract call data for B3TR token approval
 * Must be called before swapB3TRForVET if allowance is insufficient
 */
export function buildApproveCallData(amount: bigint): {
  to: string
  data: string
  value: string
} {
  const b3trAddress = getB3TRAddress()
  const swapperAddress = getSwapperAddress()

  if (!b3trAddress) {
    throw new Error('B3TR token address not configured')
  }
  if (!swapperAddress) {
    throw new Error('B3TRVetSwapper contract address not configured')
  }

  // Function selector for approve(address,uint256)
  const functionSelector = '0x095ea7b3'

  // Encode parameters
  const spenderHex = swapperAddress.slice(2).toLowerCase().padStart(64, '0')
  const amountHex = amount.toString(16).padStart(64, '0')

  const data = functionSelector + spenderHex + amountHex

  return {
    to: b3trAddress,
    data,
    value: '0x0'
  }
}

/**
 * Build call data for getEstimatedVETOut view function
 */
export function buildGetEstimateCallData(amountInB3TR: bigint): {
  to: string
  data: string
} {
  const swapperAddress = getSwapperAddress()

  if (!swapperAddress) {
    throw new Error('B3TRVetSwapper contract address not configured')
  }

  // Function selector for getEstimatedVETOut(uint256)
  const functionSelector = '0xa5dd2ff4'

  // Encode parameter
  const amountHex = amountInB3TR.toString(16).padStart(64, '0')

  return {
    to: swapperAddress,
    data: functionSelector + amountHex
  }
}

/**
 * Validate swap parameters
 */
export function validateSwapParams(params: SwapB3TRParams): void {
  if (params.amountIn <= BigInt(0)) {
    throw new Error('Amount must be greater than 0')
  }
  if (params.amountOutMin < BigInt(0)) {
    throw new Error('Minimum output cannot be negative')
  }
  if (params.deadline <= BigInt(Math.floor(Date.now() / 1000))) {
    throw new Error('Deadline must be in the future')
  }
}

/**
 * Check if the B3TR swap service is properly configured
 */
export function isB3TRSwapConfigured(): boolean {
  const swapperAddress = getSwapperAddress()
  const b3trAddress = getB3TRAddress()
  return Boolean(swapperAddress) && Boolean(b3trAddress)
}

import { useCallback, useState, useMemo } from 'react';
import { useSendTransaction, useWallet } from '@vechain/vechain-kit';
import { Clause, Address, ABIFunction, ABIItem, Units } from '@vechain/sdk-core';
import type { TransactionClause } from '@vechain/sdk-core';

import {
  B3TR_TOKEN_MAINNET,
  B3TR_TOKEN_TESTNET,
  getCurrentNetwork,
} from '../config/addresses';

// B3TRVetSwapper contract address - should be set after deployment
const B3TR_VET_SWAPPER_MAINNET = import.meta.env.VITE_B3TR_SWAPPER_MAINNET ?? '';
const B3TR_VET_SWAPPER_TESTNET = import.meta.env.VITE_B3TR_SWAPPER_TESTNET ?? '';

// ABI fragments for ERC20 approve and B3TRVetSwapper functions
const ERC20_APPROVE_ABI = ABIItem.ofSignature(
  ABIFunction,
  'function approve(address spender, uint256 amount) returns (bool)'
);

const SWAP_B3TR_FOR_VET_ABI = ABIItem.ofSignature(
  ABIFunction,
  'function swapB3TRForVET(uint256 amountIn, uint256 amountOutMin, uint256 deadline)'
);

const GET_ESTIMATED_VET_OUT_ABI = ABIItem.ofSignature(
  ABIFunction,
  'function getEstimatedVETOut(uint256 amountInB3TR) view returns (uint256)'
);

export type SwapStatus = 'idle' | 'approving' | 'swapping' | 'success' | 'error';

export interface UseB3TRSwapProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export interface UseB3TRSwapReturn {
  /** Execute the B3TR to VET swap */
  swapB3TRForVET: (amountB3TR: string, slippageBps?: number, estimatedVETOut?: string) => Promise<void>;
  /** Get estimated VET output for a given B3TR amount */
  getEstimatedVETOut: (amountB3TR: string) => Promise<string>;
  /** Current swap status */
  status: SwapStatus;
  /** Error message if any */
  error: string | null;
  /** Reset status to idle */
  resetStatus: () => void;
  /** Whether the hook is properly configured */
  isConfigured: boolean;
  /** Transaction receipt from the last successful transaction */
  txReceipt: unknown | null;
  /** Whether a transaction is pending */
  isTransactionPending: boolean;
}

/**
 * Hook to swap B3TR tokens for VET using the B3TRVetSwapper contract.
 *
 * This hook handles:
 * 1. Approving the swapper contract to spend B3TR tokens
 * 2. Executing the swap transaction
 * 3. Managing transaction status and errors
 *
 * @example
 * ```tsx
 * const { swapB3TRForVET, status, error } = useB3TRSwap({
 *   onSuccess: () => console.log('Swap completed!'),
 *   onError: (err) => console.error('Swap failed:', err),
 * });
 *
 * // Swap 100 B3TR with 1% slippage
 * await swapB3TRForVET('100', 100);
 * ```
 */
export function useB3TRSwap(props: UseB3TRSwapProps = {}): UseB3TRSwapReturn {
  const { onSuccess, onError } = props;
  const { account } = useWallet();

  const [status, setStatus] = useState<SwapStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Get network-specific addresses
  const network = getCurrentNetwork();
  const b3trAddress = network === 'mainnet' ? B3TR_TOKEN_MAINNET : B3TR_TOKEN_TESTNET;
  const swapperAddress = network === 'mainnet' ? B3TR_VET_SWAPPER_MAINNET : B3TR_VET_SWAPPER_TESTNET;

  const isConfigured = useMemo(() => {
    return Boolean(b3trAddress && swapperAddress && account?.address);
  }, [b3trAddress, swapperAddress, account?.address]);

  // Use the VeChainKit send transaction hook
  const {
    sendTransaction,
    isTransactionPending,
    txReceipt,
    resetStatus: resetTxStatus,
  } = useSendTransaction({
    signerAccountAddress: account?.address ?? null,
    onTxConfirmed: () => {
      setStatus('success');
      onSuccess?.();
    },
    onTxFailedOrCancelled: (err) => {
      const errorMessage = typeof err === 'string' ? err : err?.message ?? 'Transaction failed';
      setStatus('error');
      setError(errorMessage);
      onError?.(errorMessage);
    },
  });

  /**
   * Get estimated VET output for a given B3TR input amount.
   * This calls the contract's getEstimatedVETOut view function.
   * Note: This is a placeholder - actual read calls should use useCallClause hook or service layer.
   */
  const getEstimatedVETOut = useCallback(async (amountB3TR: string): Promise<string> => {
    if (!isConfigured) {
      throw new Error('B3TR swap not configured. Check contract addresses.');
    }

    // Convert to wei (18 decimals for B3TR)
    const amountWei = Units.parseUnits(amountB3TR, Units.ether);

    // Build the call clause for the view function
    const clause = Clause.callFunction(
      Address.of(swapperAddress),
      GET_ESTIMATED_VET_OUT_ABI,
      [amountWei]
    );

    // For view functions, we need to use useCallClause hook or a service layer
    // This is a placeholder - the b3trSwap.ts service (T3) should handle actual reads
    console.log('getEstimatedVETOut clause:', clause);

    // Return placeholder - the service layer should implement the actual call
    return '0';
  }, [isConfigured, swapperAddress]);

  /**
   * Execute B3TR to VET swap.
   *
   * @param amountB3TR - Amount of B3TR to swap (in token units, not wei)
   * @param slippageBps - Slippage tolerance in basis points (100 = 1%). Default: 100
   * @param estimatedVETOut - Expected VET output (from getEstimatedVETOut). If provided, used for slippage protection.
   */
  const swapB3TRForVET = useCallback(async (
    amountB3TR: string,
    slippageBps: number = 100,
    estimatedVETOut?: string
  ): Promise<void> => {
    if (!isConfigured) {
      const errorMsg = 'B3TR swap not configured. Check contract addresses and wallet connection.';
      setError(errorMsg);
      setStatus('error');
      onError?.(errorMsg);
      return;
    }

    if (!account?.address) {
      const errorMsg = 'Wallet not connected';
      setError(errorMsg);
      setStatus('error');
      onError?.(errorMsg);
      return;
    }

    try {
      setError(null);
      setStatus('approving');

      // Convert to wei (18 decimals for B3TR)
      const amountWei = Units.parseUnits(amountB3TR, Units.ether);

      // Calculate deadline (30 minutes from now)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 60);

      // Calculate minimum output with slippage protection
      let amountOutMin = BigInt(0);
      if (estimatedVETOut && Number(estimatedVETOut) > 0) {
        // Apply slippage: minOut = estimated * (10000 - slippageBps) / 10000
        // Use string manipulation to avoid FixedPointNumber arithmetic issues
        const estimatedWei = Units.parseUnits(estimatedVETOut, Units.ether);
        const estimatedBigInt = BigInt(estimatedWei.toString());
        amountOutMin = (estimatedBigInt * BigInt(10000 - slippageBps)) / BigInt(10000);
      }

      // Build approval clause
      const approveClause = Clause.callFunction(
        Address.of(b3trAddress),
        ERC20_APPROVE_ABI,
        [swapperAddress, amountWei]
      ) as TransactionClause;

      // Build swap clause
      const swapClause = Clause.callFunction(
        Address.of(swapperAddress),
        SWAP_B3TR_FOR_VET_ABI,
        [amountWei, amountOutMin, deadline]
      ) as TransactionClause;

      setStatus('swapping');

      // Send both clauses in a single transaction (VeChain supports multi-clause txs)
      await sendTransaction([approveClause, swapClause]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Swap failed';
      setError(errorMessage);
      setStatus('error');
      onError?.(errorMessage);
    }
  }, [isConfigured, account?.address, b3trAddress, swapperAddress, sendTransaction, onError]);

  const resetStatus = useCallback(() => {
    setStatus('idle');
    setError(null);
    resetTxStatus();
  }, [resetTxStatus]);

  return {
    swapB3TRForVET,
    getEstimatedVETOut,
    status,
    error,
    resetStatus,
    isConfigured,
    txReceipt,
    isTransactionPending,
  };
}

export default useB3TRSwap;

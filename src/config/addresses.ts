/**
 * VeChain Network Addresses Configuration
 *
 * This file contains verified contract addresses for VeChain mainnet and testnet.
 * Sources:
 * - VeRocket: https://verocket.com (VeChain's leading DEX)
 * - B3TR: VeBetterDAO governance token
 */

// VeRocket DEX Router (Uniswap V2 compatible)
// Mainnet: https://verocket.com
export const VEROCKET_ROUTER_MAINNET = '0x576da7124C7bB65a692d95848276367e5a844d95';

// VeRocket testnet router (if available, otherwise use mock for testing)
export const VEROCKET_ROUTER_TESTNET = import.meta.env.VITE_VEROCKET_ROUTER_TESTNET ?? '';

// B3TR Token Address (VeBetterDAO governance token)
// Mainnet: https://vechainstats.com/token/0x5ef79995fe8a89e0812330e4378eb2660cede699
export const B3TR_TOKEN_MAINNET = '0x5ef79995FE8a89e0812330E4378eB2660ceDe699';

// B3TR testnet address
export const B3TR_TOKEN_TESTNET = import.meta.env.VITE_B3TR_TOKEN_TESTNET ?? '';

// WVET (Wrapped VET) addresses
// Used as intermediate token for VET swaps on DEXs
export const WVET_MAINNET = '0xD8CCDD85abDbF68DFEc95f06c973e87B1b5A9997';
export const WVET_TESTNET = import.meta.env.VITE_WVET_TESTNET ?? '';

// B3TRVetSwapper Contract Addresses
// Deploy with: npx hardhat run scripts/deploy.cjs --network vechain_testnet
export const B3TR_VET_SWAPPER_MAINNET = import.meta.env.VITE_B3TR_SWAPPER_MAINNET ?? '';
export const B3TR_VET_SWAPPER_TESTNET = import.meta.env.VITE_B3TR_SWAPPER_TESTNET ?? '';

// Network-specific address getter
export type NetworkType = 'mainnet' | 'testnet';

export interface NetworkAddresses {
  routerAddress: string;
  b3trAddress: string;
  wvetAddress: string;
  swapperAddress: string;
}

export function getNetworkAddresses(network: NetworkType): NetworkAddresses {
  if (network === 'mainnet') {
    return {
      routerAddress: VEROCKET_ROUTER_MAINNET,
      b3trAddress: B3TR_TOKEN_MAINNET,
      wvetAddress: WVET_MAINNET,
      swapperAddress: B3TR_VET_SWAPPER_MAINNET,
    };
  }

  // Testnet
  return {
    routerAddress: VEROCKET_ROUTER_TESTNET,
    b3trAddress: B3TR_TOKEN_TESTNET,
    wvetAddress: WVET_TESTNET,
    swapperAddress: B3TR_VET_SWAPPER_TESTNET,
  };
}

// Validate address format
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Get current network from environment
export function getCurrentNetwork(): NetworkType {
  const nodeUrl = import.meta.env.VITE_VECHAIN_NODE_URL ?? '';
  if (nodeUrl.includes('mainnet') || nodeUrl.includes('veblocks.net')) {
    return 'mainnet';
  }
  return 'testnet';
}

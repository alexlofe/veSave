/**
 * VeChain Network Addresses Configuration (CommonJS)
 *
 * This file contains verified contract addresses for VeChain mainnet and testnet.
 * For use in Hardhat scripts and deployment.
 *
 * Sources:
 * - VeRocket: https://verocket.com (VeChain's leading DEX)
 * - B3TR: VeBetterDAO governance token
 */

// VeRocket DEX Router (Uniswap V2 compatible)
// Mainnet: https://verocket.com
const VEROCKET_ROUTER_MAINNET = '0x576da7124C7bB65a692d95848276367e5a844d95';

// VeRocket testnet router (set via environment variable if available)
const VEROCKET_ROUTER_TESTNET = process.env.VEROCKET_ROUTER_TESTNET || '';

// B3TR Token Address (VeBetterDAO governance token)
// Mainnet: https://vechainstats.com/token/0x5ef79995fe8a89e0812330e4378eb2660cede699
const B3TR_TOKEN_MAINNET = '0x5ef79995FE8a89e0812330E4378eB2660ceDe699';

// B3TR testnet address
const B3TR_TOKEN_TESTNET = process.env.B3TR_TOKEN_TESTNET || '';

// WVET (Wrapped VET) addresses
// Used as intermediate token for VET swaps on DEXs
const WVET_MAINNET = '0xD8CCDD85abDbF68DFEc95f06c973e87B1b5A9997';
const WVET_TESTNET = process.env.WVET_TESTNET || '';

/**
 * Get addresses for a specific network
 * @param {string} network - 'mainnet' or 'testnet'
 * @returns {Object} Object containing routerAddress, b3trAddress, wvetAddress
 */
function getNetworkAddresses(network) {
  if (network === 'mainnet' || network === 'vechain_mainnet') {
    return {
      routerAddress: VEROCKET_ROUTER_MAINNET,
      b3trAddress: B3TR_TOKEN_MAINNET,
      wvetAddress: WVET_MAINNET,
    };
  }

  // Testnet
  return {
    routerAddress: VEROCKET_ROUTER_TESTNET,
    b3trAddress: B3TR_TOKEN_TESTNET,
    wvetAddress: WVET_TESTNET,
  };
}

/**
 * Validate Ethereum/VeChain address format
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid address format
 */
function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

module.exports = {
  // Mainnet addresses
  VEROCKET_ROUTER_MAINNET,
  B3TR_TOKEN_MAINNET,
  WVET_MAINNET,

  // Testnet addresses
  VEROCKET_ROUTER_TESTNET,
  B3TR_TOKEN_TESTNET,
  WVET_TESTNET,

  // Helper functions
  getNetworkAddresses,
  isValidAddress,
};

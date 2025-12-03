// CRITICAL: WanBridge API base URL is required for cross-chain bridging functionality
const _wanbridgeApiBase = import.meta.env.VITE_WANBRIDGE_API_BASE
if (!_wanbridgeApiBase) {
  console.error(
    '[CONFIG ERROR] VITE_WANBRIDGE_API_BASE is not set. ' +
    'Cross-chain bridging will fail. Set this in your .env file.'
  )
}
export const WANBRIDGE_API_BASE = _wanbridgeApiBase ?? ''

export const WANBRIDGE_STATUS_BASE =
  import.meta.env.VITE_WANBRIDGE_STATUS_BASE ?? 'https://bridge-api.wanchain.org/api/status'

export const WANBRIDGE_FROM_CHAIN = import.meta.env.VITE_WANBRIDGE_FROM_CHAIN ?? 'ETH'

export const WANBRIDGE_TO_CHAIN = import.meta.env.VITE_WANBRIDGE_TO_CHAIN ?? 'VET'

export const WANBRIDGE_PARTNER = import.meta.env.VITE_WANBRIDGE_PARTNER ?? ''

export const SEPOLIA_TX_BASE =
  import.meta.env.VITE_SEPOLIA_TX_BASE ?? 'https://sepolia.etherscan.io/tx'

export const VECHAIN_TESTNET_TX_BASE =
  import.meta.env.VITE_VECHAIN_TESTNET_TX_BASE ??
  'https://explore-testnet.vechain.org/transactions'

export const BACKEND_API_BASE = import.meta.env.VITE_BACKEND_API_BASE ?? ''

export const VECHAIN_NODE_URL =
  import.meta.env.VITE_VECHAIN_NODE_URL ?? 'https://testnet.vechain.org/'

// VET is the native VeChain asset, so no contract address exists.
export const VECHAIN_NATIVE_TOKEN = 'VET'

// WARNING: Stargate router address MUST be configured before production use.
// The zero address default will cause staking transactions to fail or burn funds!
// Set VITE_STARGATE_ROUTER_ADDRESS in your .env file with the correct contract address.
export const STARGATE_ROUTER_ADDRESS =
  import.meta.env.VITE_STARGATE_ROUTER_ADDRESS ?? '0x0000000000000000000000000000000000000000'

export const DEFAULT_GAS_LIMIT = 550_000n

export const SEPOLIA_USDC_ADDRESS =
  import.meta.env.VITE_SEPOLIA_USDC_ADDRESS

export const VECHAIN_TESTNET_USDC_ADDRESS =
  import.meta.env.VITE_VECHAIN_TESTNET_USDC_ADDRESS
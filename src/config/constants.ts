export const WANBRIDGE_API_BASE =
  import.meta.env.VITE_WANBRIDGE_API_BASE ?? 'https://bridge-api.wanchain.org/api/testnet'

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

export const SEPOLIA_USDC_ADDRESS =
  import.meta.env.VITE_SEPOLIA_USDC_ADDRESS ?? '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'

export const VECHAIN_TESTNET_USDC_ADDRESS =
  import.meta.env.VITE_VECHAIN_TESTNET_USDC_ADDRESS ?? '0xAf9555d393212F82A74d892139a4F5D349a8F3f6'

// VET is the native VeChain asset, so no contract address exists.
export const VECHAIN_NATIVE_TOKEN = 'VET'

export const STARGATE_ROUTER_ADDRESS =
  import.meta.env.VITE_STARGATE_ROUTER_ADDRESS ?? '0x0000000000000000000000000000000000000000'

export const DEFAULT_GAS_LIMIT = 550_000n

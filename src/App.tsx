import { useWallet, useConnectModal } from '@vechain/vechain-kit'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'

import { useEphemeralWallet } from './hooks/useEphemeralWallet'
import { useBridgeWorkflow } from './hooks/useBridgeWorkflow'
import {
  SEPOLIA_TX_BASE,
  VECHAIN_TESTNET_TX_BASE,
  WANBRIDGE_STATUS_BASE,
} from './config/constants'

const DEFAULT_AMOUNT = '5'

type StatusLink = {
  url: string
  label?: string
} | null

const buildExplorerLink = (base: string, id: string) => `${base.replace(/\/$/, '')}/${id}`

const App = () => {
  const { account, connection, disconnect } = useWallet()
  const { open: openConnectModal } = useConnectModal()

  const connectedAddress = account?.address ?? null
  const isConnected = connection?.isConnected ?? false

  const [usdcAmount, setUsdcAmount] = useState(DEFAULT_AMOUNT)
  const [networkError, setNetworkError] = useState<string | null>(null)
  const [isWalletModalOpen, setWalletModalOpen] = useState(false)
  const [copyState, setCopyState] = useState<string | null>(null)
  const [isStatusExpanded, setStatusExpanded] = useState(false)

  const { wallet: walletSession, createWallet, resetWallet } = useEphemeralWallet()
  const {
    statuses,
    isRunning,
    error,
    executeFullFlow,
    resetWorkflow,
    lastSwap,
    lastBridge,
    lastStake,
  } = useBridgeWorkflow(walletSession)

  const isSubmitDisabled = useMemo(() => {
    const amountValue = Number(usdcAmount)
    return Number.isNaN(amountValue) || amountValue <= 0 || !walletSession || isRunning
  }, [isRunning, usdcAmount, walletSession])

  const statusLinks = useMemo(() => {
    const swap: StatusLink = lastSwap?.txHash
      ? { url: buildExplorerLink(VECHAIN_TESTNET_TX_BASE, lastSwap.txHash) }
      : null

    const bridge: StatusLink = lastBridge?.txHash
      ? { url: buildExplorerLink(SEPOLIA_TX_BASE, lastBridge.txHash) }
      : lastBridge?.taskId
        ? { url: buildExplorerLink(WANBRIDGE_STATUS_BASE, lastBridge.taskId), label: 'View bridge status' }
        : null

    const stake: StatusLink = lastStake?.txHash
      ? { url: buildExplorerLink(VECHAIN_TESTNET_TX_BASE, lastStake.txHash) }
      : null

    return { swap, bridge, stake }
  }, [lastSwap, lastBridge, lastStake])

  const accountPreview = useMemo(
    () =>
      connectedAddress
        ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`
        : '',
    [connectedAddress],
  )

  const handleLogin = () => {
    openConnectModal()
  }

  const handleCreateWallet = async () => {
    setNetworkError(null)
    setCopyState(null)
    try {
      await createWallet()
      setWalletModalOpen(true)
    } catch (creationError) {
      setNetworkError(
        creationError instanceof Error
          ? creationError.message
          : 'Unable to create wallet. Retry shortly.',
      )
    }
  }

  const handleReset = async () => {
    resetWorkflow()
    setNetworkError(null)
    setUsdcAmount(DEFAULT_AMOUNT)
    setWalletModalOpen(false)
    setCopyState(null)
    await resetWallet()
  }

  const handleLogout = async () => {
    disconnect()
    await handleReset()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNetworkError(null)

    if (!walletSession) {
      setNetworkError('Create a deposit wallet before starting the workflow.')
      return
    }

    const amountValue = Number(usdcAmount)
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setNetworkError('Enter a valid USDC amount.')
      return
    }

    try {
      await executeFullFlow({ usdcAmount: amountValue })
    } catch (workflowError) {
      setNetworkError(
        workflowError instanceof Error
          ? workflowError.message
          : 'Workflow failed. See logs for details.',
      )
    }
  }

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopyState(`${label} copied`)
      setTimeout(() => setCopyState(null), 2500)
    } catch {
      setCopyState('Copy failed')
      setTimeout(() => setCopyState(null), 2500)
    }
  }

  if (!isConnected) {
    return (
      <div className="login-screen">
        <h1>veSave - the better way to save</h1>
        <button
          className="primary"
          type="button"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>veSave</h1>
          <p className="subtitle">Bridge, swap, and stake USDC with one click.</p>
        </div>
        <div className="header-actions">
          {accountPreview ? <span className="helper-text">Logged in: {accountPreview}</span> : null}
          <button className="secondary" onClick={() => { void handleLogout() }} type="button">
            Logout
          </button>
          <button
            className="secondary"
            disabled={Boolean(walletSession)}
            onClick={handleCreateWallet}
            type="button"
          >
            {walletSession ? 'Wallet Ready' : 'Create Deposit Wallet'}
          </button>
          <button className="ghost" onClick={handleReset} type="button">
            Reset Session
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="panel">
          <header>
            <h2>Deposit &amp; Automations</h2>
            <p className="helper-text">
              Add funds to your deposit address and your funds will be bridged to VeChain, swaped to
              VET, then stakeed in Stargate.
            </p>
          </header>

          <form className="automation-form" onSubmit={handleSubmit}>
            <label className="input-group">
              <span className="label">USDC amount (Sepolia)</span>
              <input
                type="number"
                min="0"
                step="5"
                value={usdcAmount}
                onChange={(event) => setUsdcAmount(event.target.value)}
                placeholder="Enter deposit amount"
              />
            </label>

            <div className="actions">
              <button className="primary start-button" disabled={isSubmitDisabled} type="submit">
                Start Saving
              </button>
            </div>
          </form>

          {walletSession ? (
            <div className="info-card">
              <div className="info-row">
                <span className="label">Ethereum deposit wallet</span>
                <span className="value monospace">{walletSession.ethereum.address}</span>
              </div>
              <div className="info-actions">
                <button
                  className="secondary"
                  onClick={() => copyToClipboard(walletSession.ethereum.address, 'Ethereum address')}
                  type="button"
                >
                  Copy ETH Address
                </button>
                <span className="helper-text subtle">
                  Send Sepolia USDC here before starting the automation.
                </span>
              </div>
              <div className="info-row">
                <span className="label">VeChain operations wallet</span>
                <span className="value monospace">{walletSession.vechain.address}</span>
              </div>
              <div className="info-actions">
                <button
                  className="secondary"
                  onClick={() => copyToClipboard(walletSession.vechain.address, 'VeChain address')}
                  type="button"
                >
                  Copy VeChain Address
                </button>
                <span className="helper-text subtle">
                  Bridged assets and staking transactions are executed from this wallet.
                </span>
              </div>
            </div>
          ) : (
            <p className="helper-text muted">
              Create a wallet to receive USDC and perform the automated strategy.
            </p>
          )}

          {copyState && !isWalletModalOpen ? (
            <span className="copy-feedback">{copyState}</span>
          ) : null}

          {(networkError ?? error) ? (
            <div className="error-box" role="alert">
              <span className="label">Error</span>
              <span className="value monospace">{networkError ?? error}</span>
            </div>
          ) : null}
        </section>

        <section
          className={`panel status-panel ${isStatusExpanded ? 'expanded' : 'collapsed'}`}
        >
          <header>
            <button
              className="status-toggle"
              onClick={() => setStatusExpanded((previous) => !previous)}
              type="button"
            >
              <span>Workflow Status</span>
              <span className={`toggle-icon ${isStatusExpanded ? 'open' : 'closed'}`}>
                ▾
              </span>
            </button>
          </header>
          {isStatusExpanded ? (
            <ul className="status-list">
              <li className={`status-item status-${statuses.bridge}`}>
                <div>
                  <span className="label">Bridge</span>
                  <p className="helper-text">WanBridge transfer from Sepolia to VeChainThor</p>
                </div>
                <StatusBadge
                  href={statusLinks.bridge?.url}
                  label={statusLinks.bridge?.label}
                  status={statuses.bridge}
                />
              </li>
              <li className={`status-item status-${statuses.swap}`}>
                <div>
                  <span className="label">Swap</span>
                  <p className="helper-text">Swap bridged USDC to native VET</p>
                </div>
                <StatusBadge href={statusLinks.swap?.url} status={statuses.swap} />
              </li>
              <li className={`status-item status-${statuses.stake}`}>
                <div>
                  <span className="label">Stake</span>
                  <p className="helper-text">Stake VET into Stargate LP</p>
                </div>
                <StatusBadge href={statusLinks.stake?.url} status={statuses.stake} />
              </li>
            </ul>
          ) : null}
        </section>
      </main>

      <footer className="app-footer">
        <span>Environment: Sepolia &amp; VeChainThor Testnet</span>
      </footer>

      {isWalletModalOpen && walletSession ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <header className="modal-header">
              <h2>Deposit Wallet Created</h2>
              <button
                aria-label="Close wallet details"
                className="icon-button"
                onClick={() => {
                  setCopyState(null)
                  setWalletModalOpen(false)
                }}
                type="button"
              >
                ×
              </button>
            </header>
            <p className="helper-text">
              Wallet keys are stored securely on the backend. Use these addresses to fund your session.
            </p>
            <div className="modal-content">
              <div className="wallet-section">
                <h3>Ethereum (Sepolia)</h3>
                <label className="input-group">
                  <span className="label">Public address</span>
                  <textarea readOnly value={walletSession.ethereum.address}></textarea>
                  <button
                    className="secondary"
                    onClick={() => copyToClipboard(walletSession.ethereum.address, 'Ethereum address')}
                    type="button"
                  >
                    Copy ETH Address
                  </button>
                </label>
              </div>
              <div className="wallet-section">
                <h3>VeChainThor Testnet</h3>
                <label className="input-group">
                  <span className="label">Public address</span>
                  <textarea readOnly value={walletSession.vechain.address}></textarea>
                  <button
                    className="secondary"
                    onClick={() => copyToClipboard(walletSession.vechain.address, 'VeChain address')}
                    type="button"
                  >
                    Copy VeChain Address
                  </button>
                </label>
              </div>
            </div>
            {copyState ? <span className="copy-feedback">{copyState}</span> : null}
            <footer className="modal-footer">
              <button
                className="primary"
                onClick={() => {
                  setCopyState(null)
                  setWalletModalOpen(false)
                }}
                type="button"
              >
                Done
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  )
}

type StatusType = 'idle' | 'pending' | 'success' | 'error'

const statusCopy: Record<StatusType, string> = {
  idle: 'Idle',
  pending: 'In progress...',
  success: 'Completed',
  error: 'Failed',
}

const StatusBadge = ({
  status,
  href,
  label,
}: {
  status: StatusType
  href?: string | null
  label?: string
}) => (
  <div className="status-meta">
    <span className={`status-badge status-${status}`}>{statusCopy[status]}</span>
    {href ? (
      <a className="status-link" href={href} rel="noopener noreferrer" target="_blank">
        {label ?? 'View transaction'}
      </a>
    ) : null}
  </div>
)

export default App

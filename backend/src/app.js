import express from 'express'
import cors from 'cors'
import axios from 'axios'
import dotenv from 'dotenv'
import { Wallet as EthersWallet, JsonRpcProvider, Contract } from 'ethers'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { createWalletBundle, getWalletBundle, deleteWalletBundle } from './walletStore.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootEnvPath = path.resolve(__dirname, '../../.env')
const backendEnvPath = path.resolve(__dirname, '../.env')

const loadEnvIfPresent = (envPath) => {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
  }
}

loadEnvIfPresent(rootEnvPath)
loadEnvIfPresent(backendEnvPath)

const joinPath = (base, path) => `${base.replace(/\/$/, '')}${path}`

const normalizeHexOrDecimal = (value) => {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'string') {
    if (value.startsWith('0x') || value.startsWith('0X')) {
      return BigInt(value)
    }
    if (value === '') return undefined
    return BigInt(value)
  }
  if (typeof value === 'number') {
    return BigInt(value)
  }
  if (typeof value === 'bigint') {
    return value
  }
  return undefined
}

export const createApp = () => {
  const app = express()

  const WANBRIDGE_API_BASE =
    process.env.WANBRIDGE_API_BASE || 'https://bridge-api.wanchain.org/api/testnet'
  const WANBRIDGE_CREATE_PATH = process.env.WANBRIDGE_CREATE_PATH || '/createTx2'
  const WANBRIDGE_STATUS_BASE =
    process.env.WANBRIDGE_STATUS_BASE || 'https://bridge-api.wanchain.org/api/status'
  const SEPOLIA_USDC_ADDRESS =
    process.env.SEPOLIA_USDC_ADDRESS || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  const VECHAIN_TESTNET_USDC_ADDRESS =
    process.env.VECHAIN_TESTNET_USDC_ADDRESS || '0xAf9555d393212F82A74d892139a4F5D349a8F3f6'
  const STARGATE_ROUTER_ADDRESS =
    process.env.STARGATE_ROUTER_ADDRESS || '0x0000000000000000000000000000000000000000'
  const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || ''

  const ERC20_ABI = [
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
  ]

  const sepoliaProvider = SEPOLIA_RPC_URL ? new JsonRpcProvider(SEPOLIA_RPC_URL) : null

  const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim())

  app.use(
    cors({
      origin: ALLOWED_ORIGINS?.length ? ALLOWED_ORIGINS : true,
    }),
  )
  app.use(express.json())

  app.get('/api/health', (_, res) => {
    res.json({
      status: 'ok',
      wanbridgeBase: WANBRIDGE_API_BASE,
      sepoliaProvider: Boolean(sepoliaProvider),
    })
  })

  app.post('/api/wallets', (_, res) => {
    try {
      const wallet = createWalletBundle()
      return res.status(201).json(wallet)
    } catch (error) {
      console.error('Failed to create wallet bundle', error)
      return res.status(500).json({ error: 'Unable to create wallet. Check server logs.' })
    }
  })

  app.delete('/api/wallets/:sessionId', (req, res) => {
    const { sessionId } = req.params
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required.' })
    }
    const deleted = deleteWalletBundle(sessionId)
    if (!deleted) {
      return res.status(404).json({ error: 'Unknown session.' })
    }
    return res.status(204).end()
  })

  const proxyWanBridgePost = async (endpointPath, payload) => {
    try {
      const endpoint = joinPath(WANBRIDGE_API_BASE, endpointPath)
      const response = await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
      })

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('WanBridge POST failed', {
          endpoint: endpointPath,
          status: error.response?.status,
          data: error.response?.data,
        })
        throw error
      }

      console.error('Unexpected WanBridge proxy error', error)
      throw error
    }
  }

  app.post('/api/bridge/create', async (req, res) => {
    const { sessionId, payload } = req.body ?? {}
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required.' })
    }
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Bridge payload is required.' })
    }

    if (!sepoliaProvider) {
      return res
        .status(500)
        .json({ error: 'SEPOLIA_RPC_URL is not configured. Unable to submit bridge transaction.' })
    }

    const walletBundle = getWalletBundle(sessionId)
    if (!walletBundle) {
      return res.status(404).json({ error: 'Unknown session. Create a wallet first.' })
    }

    const txData = payload?.txData ?? {}

    try {
      const {
        data: createResponse,
        wallet: { privateKey },
      } = await proxyWanBridgePost(WANBRIDGE_CREATE_PATH, payload)

      const wallet = new EthersWallet(privateKey, sepoliaProvider)

      if (txData.approveAmount) {
        const allowanceArgs = [wallet.address, txData.contractAddress]

        const spenderAllowance = await new Contract(
          SEPOLIA_USDC_ADDRESS,
          ERC20_ABI,
          wallet,
        ).allowance(...allowanceArgs)

        if (spenderAllowance < normalizeHexOrDecimal(txData.approveAmount)) {
          const approvalResponse = await new Contract(
            SEPOLIA_USDC_ADDRESS,
            ERC20_ABI,
            wallet,
          ).approve(txData.contractAddress, txData.approveAmount)
          await approvalResponse.wait()
        }
      }

      const txRequest = {
        to: txData.contractAddress,
        data: txData.contractData,
        value: normalizeHexOrDecimal(txData.value) ?? 0n,
        gasLimit: normalizeHexOrDecimal(txData.gas),
        maxPriorityFeePerGas: normalizeHexOrDecimal(txData.maxPriorityFeePerGas),
        maxFeePerGas: normalizeHexOrDecimal(txData.maxFeePerGas),
      }

      if (txData.gasPrice) {
        txRequest.gasPrice = normalizeHexOrDecimal(txData.gasPrice)
      }

      if (txData.nonce !== undefined) {
        txRequest.nonce =
          typeof txData.nonce === 'string' && txData.nonce.startsWith('0x')
            ? Number(BigInt(txData.nonce))
            : Number(txData.nonce)
      }

      if (txData.chainId !== undefined) {
        txRequest.chainId =
          typeof txData.chainId === 'string' && txData.chainId.startsWith('0x')
            ? Number(BigInt(txData.chainId))
            : Number(txData.chainId)
      }

      const txResponse = await wallet.sendTransaction(txRequest)
      await txResponse.wait()

      return res.json({
        taskId: createResponse.taskId ?? null,
        txHash: txResponse.hash,
      })
    } catch (error) {
      console.error('Bridge execution failed', error)
      if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? 500
        const message =
          error.response?.data ??
          error.message ??
          'WanBridge request failed. Check backend logs for details.'
        return res.status(status).json({ error: message })
      }
      return res.status(500).json({ error: 'Bridge execution encountered an unexpected error.' })
    }
  })

  app.post('/api/bridge/status', async (req, res) => {
    const { taskId } = req.body ?? {}
    if (!taskId || typeof taskId !== 'string') {
      return res.status(400).json({ error: 'Missing taskId for status query.' })
    }

    try {
      const endpoint = joinPath(WANBRIDGE_STATUS_BASE, `/${taskId}`)
      const response = await axios.get(endpoint)
      return res.status(response.status).json(response.data)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('WanBridge status failed', {
          taskId,
          status: error.response?.status,
          data: error.response?.data,
        })
        const status = error.response?.status ?? 500
        const message =
          error.response?.data ??
          error.message ??
          'WanBridge status request failed. Check backend logs for details.'
        return res.status(status).json({ error: message })
      }

      console.error('Unexpected WanBridge status error', error)
      return res.status(500).json({ error: 'Bridge status proxy encountered an unexpected error.' })
    }
  })

  app.post('/api/conversion/usdc-to-vet', (req, res) => {
    const { sessionId, usdcAmount, depositAddress, slippageBps } = req.body ?? {}

    if (sessionId && !getWalletBundle(sessionId)) {
      return res.status(404).json({ error: 'Unknown session. Create a wallet first.' })
    }

    const amountAsNumber = Number(usdcAmount)
    if (!Number.isFinite(amountAsNumber) || amountAsNumber <= 0) {
      return res.status(400).json({ error: 'Invalid usdcAmount supplied.' })
    }

    if (typeof depositAddress !== 'string' || !depositAddress) {
      return res.status(400).json({ error: 'depositAddress is required.' })
    }

    const slippage = Number(slippageBps ?? 50)
    const slippageDecimal = Math.max(slippage, 0) / 10_000

    const vetAmount = amountAsNumber // 1:1 mock
    const minimumReceived = vetAmount * (1 - slippageDecimal)

    return res.json({
      txHash: `0xmockSwap${Date.now().toString(16)}`,
      vetAmount: vetAmount.toString(),
      minimumReceived: minimumReceived.toFixed(6),
      quoteId: `mock-quote-${Date.now()}`,
      usdcToken: SEPOLIA_USDC_ADDRESS ?? 'USDC',
      vetToken: VECHAIN_TESTNET_USDC_ADDRESS ?? 'VET',
    })
  })

  app.post('/api/stargate/stake', (req, res) => {
    const { sessionId, vetAmount, depositAddress, dstChainId, poolId } = req.body ?? {}

    if (sessionId && !getWalletBundle(sessionId)) {
      return res.status(404).json({ error: 'Unknown session. Create a wallet first.' })
    }

    if (!depositAddress || typeof depositAddress !== 'string') {
      return res.status(400).json({ error: 'depositAddress is required.' })
    }

    const amount = Number(vetAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid vetAmount supplied.' })
    }

    return res.json({
      txHash: `0xmockStake${Date.now().toString(16)}`,
      routerAddress: STARGATE_ROUTER_ADDRESS,
      depositAddress,
      vetAmount: amount.toString(),
      dstChainId: dstChainId ?? null,
      poolId: poolId ?? null,
    })
  })

  return app
}

export default createApp

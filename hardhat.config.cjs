require("@nomicfoundation/hardhat-chai-matchers");
require("solidity-coverage");
require("dotenv").config();

const MAINNET_RPC = process.env.VECHAIN_MAINNET_RPC || "https://mainnet.vechain.org";
const TESTNET_RPC = process.env.VECHAIN_TESTNET_RPC || "https://testnet.vechain.org";
const FORK_BLOCK = process.env.FORK_BLOCK_NUMBER ? parseInt(process.env.FORK_BLOCK_NUMBER) : undefined;

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },

  networks: {
    hardhat: {
      forking: process.env.FORK_MAINNET === "true" ? {
        url: MAINNET_RPC,
        blockNumber: FORK_BLOCK,
        enabled: true
      } : undefined,
      chainId: process.env.FORK_MAINNET === "true" ? 100009 : 31337
    },
    vechain_mainnet: {
      url: MAINNET_RPC,
      chainId: 100009,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
    },
    vechain_testnet: {
      url: TESTNET_RPC,
      chainId: 100010,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
    }
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },

  mocha: { timeout: 120000 }
};

const hre = require("hardhat");

// VeChain Network Configurations
const NETWORKS = {
  vechain_mainnet: {
    name: "VeChain Mainnet",
    chainId: 100009,
    // VeRocket Router - Primary DEX on VeChain mainnet
    routerAddress: "0x576da7124c7bb65a692d95848276367e5a844d95",
    // B3TR Token on VeChain mainnet
    b3trAddress: "0x5ef79995FE8a89e0812330E4378eB2660ceDe699",
    explorerUrl: "https://explore.vechain.org",
  },
  vechain_testnet: {
    name: "VeChain Testnet",
    chainId: 100010,
    // Testnet router - may need to be updated with actual testnet DEX
    routerAddress: process.env.TESTNET_ROUTER_ADDRESS || "0x0000000000000000000000000000000000000000",
    // B3TR Token on VeChain testnet
    b3trAddress: process.env.TESTNET_B3TR_ADDRESS || "0x0000000000000000000000000000000000000000",
    explorerUrl: "https://explore-testnet.vechain.org",
  },
  localhost: {
    name: "Localhost (Hardhat)",
    chainId: 31337,
    // For local testing, these will be deployed mocks
    routerAddress: null, // Will deploy mock
    b3trAddress: null, // Will deploy mock
    explorerUrl: null,
  },
};

async function deployMocks() {
  console.log("Deploying mock contracts for local testing...\n");

  // Deploy Mock B3TR Token
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const mockB3TR = await MockERC20.deploy("Mock B3TR", "mB3TR");
  await mockB3TR.waitForDeployment();
  const b3trAddress = await mockB3TR.getAddress();
  console.log(`  MockB3TR deployed to: ${b3trAddress}`);

  // Deploy Mock WVET Token (needed for router)
  const mockWVET = await MockERC20.deploy("Mock WVET", "mWVET");
  await mockWVET.waitForDeployment();
  const wvetAddress = await mockWVET.getAddress();
  console.log(`  MockWVET deployed to: ${wvetAddress}`);

  // Deploy Mock Router with WVET address
  const MockRouter = await hre.ethers.getContractFactory("MockUniswapV2Router");
  const mockRouter = await MockRouter.deploy(wvetAddress);
  await mockRouter.waitForDeployment();
  const routerAddress = await mockRouter.getAddress();
  console.log(`  MockRouter deployed to: ${routerAddress}`);

  return { b3trAddress, routerAddress, wvetAddress };
}

async function main() {
  console.log("=".repeat(60));
  console.log("B3TRVetSwapper Deployment Script");
  console.log("=".repeat(60));
  console.log();

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  const networkName = hre.network.name;
  const chainId = Number(network.chainId);

  console.log(`Network: ${networkName}`);
  console.log(`Chain ID: ${chainId}`);
  console.log();

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await hre.ethers.provider.getBalance(deployerAddress);

  console.log(`Deployer: ${deployerAddress}`);
  console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH/VET`);
  console.log();

  // Check for sufficient balance
  if (balance === 0n) {
    throw new Error("Deployer account has no balance. Please fund the account before deploying.");
  }

  // Determine addresses based on network
  let b3trAddress, routerAddress, networkConfig;

  if (networkName === "localhost" || networkName === "hardhat") {
    // Deploy mocks for local testing
    const mocks = await deployMocks();
    b3trAddress = mocks.b3trAddress;
    routerAddress = mocks.routerAddress;
    networkConfig = NETWORKS.localhost;
  } else if (networkName === "vechain_mainnet" || chainId === 100009) {
    networkConfig = NETWORKS.vechain_mainnet;
    b3trAddress = process.env.B3TR_ADDRESS || networkConfig.b3trAddress;
    routerAddress = process.env.ROUTER_ADDRESS || networkConfig.routerAddress;
  } else if (networkName === "vechain_testnet" || chainId === 100010) {
    networkConfig = NETWORKS.vechain_testnet;
    b3trAddress = process.env.B3TR_ADDRESS || networkConfig.b3trAddress;
    routerAddress = process.env.ROUTER_ADDRESS || networkConfig.routerAddress;
  } else {
    // Custom network - require environment variables
    b3trAddress = process.env.B3TR_ADDRESS;
    routerAddress = process.env.ROUTER_ADDRESS;

    if (!b3trAddress || !routerAddress) {
      throw new Error(
        "Unknown network. Please set B3TR_ADDRESS and ROUTER_ADDRESS environment variables."
      );
    }

    networkConfig = {
      name: networkName,
      chainId,
      b3trAddress,
      routerAddress,
      explorerUrl: null,
    };
  }

  // Validate addresses
  if (!b3trAddress || b3trAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("Invalid B3TR address. Please set B3TR_ADDRESS environment variable.");
  }
  if (!routerAddress || routerAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("Invalid Router address. Please set ROUTER_ADDRESS environment variable.");
  }

  console.log("Deployment Configuration:");
  console.log(`  B3TR Address: ${b3trAddress}`);
  console.log(`  Router Address: ${routerAddress}`);
  console.log();

  // Deploy B3TRVetSwapper
  console.log("Deploying B3TRVetSwapper...");
  const B3TRVetSwapper = await hre.ethers.getContractFactory("B3TRVetSwapper");
  const swapper = await B3TRVetSwapper.deploy(b3trAddress, routerAddress);
  await swapper.waitForDeployment();
  const swapperAddress = await swapper.getAddress();

  console.log();
  console.log("=".repeat(60));
  console.log("DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log();
  console.log(`B3TRVetSwapper deployed to: ${swapperAddress}`);
  console.log();

  // Verify contract state
  console.log("Verifying contract state...");
  const deployedB3TR = await swapper.B3TR_ADDRESS();
  const deployedRouter = await swapper.router();
  const owner = await swapper.owner();

  console.log(`  B3TR_ADDRESS: ${deployedB3TR}`);
  console.log(`  Router: ${deployedRouter}`);
  console.log(`  Owner: ${owner}`);
  console.log();

  // Print explorer link if available
  if (networkConfig?.explorerUrl) {
    console.log("View on Explorer:");
    console.log(`  ${networkConfig.explorerUrl}/accounts/${swapperAddress}`);
    console.log();
  }

  // Print verification instructions for mainnet/testnet
  if (networkName !== "localhost" && networkName !== "hardhat") {
    console.log("=".repeat(60));
    console.log("VERIFICATION INSTRUCTIONS");
    console.log("=".repeat(60));
    console.log();
    console.log("To verify on VeChain Explorer, submit the following:");
    console.log();
    console.log("Contract Address:", swapperAddress);
    console.log("Constructor Arguments:");
    console.log(`  _b3trAddress: ${b3trAddress}`);
    console.log(`  _routerAddress: ${routerAddress}`);
    console.log();
    console.log("Compiler Settings:");
    console.log("  Solidity Version: 0.8.20");
    console.log("  Optimizer: Enabled (200 runs)");
    console.log("  EVM Version: Default");
    console.log();
  }

  // Return deployment info for programmatic use
  return {
    network: networkName,
    chainId,
    deployer: deployerAddress,
    contracts: {
      B3TRVetSwapper: swapperAddress,
      B3TR: b3trAddress,
      Router: routerAddress,
    },
  };
}

// Execute deployment
main()
  .then((result) => {
    console.log("Deployment completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error.message);
    process.exit(1);
  });

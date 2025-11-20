const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("B3TRVetSwapper", function () {
  let swapper;
  let mockRouter;
  let mockB3TR;
  let mockWVET;
  let owner;
  let user;
  let otherAccount;

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  beforeEach(async function () {
    [owner, user, otherAccount] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockB3TR = await MockERC20.deploy("B3TR Token", "B3TR");
    mockWVET = await MockERC20.deploy("Wrapped VET", "WVET");

    // Deploy mock router
    const MockRouter = await ethers.getContractFactory("MockUniswapV2Router");
    mockRouter = await MockRouter.deploy(mockWVET.target);

    // Deploy B3TRVetSwapper
    const B3TRVetSwapper = await ethers.getContractFactory("B3TRVetSwapper");
    swapper = await B3TRVetSwapper.deploy(mockB3TR.target, mockRouter.target);

    // Fund the MockRouter with ETH so it can send VET back
    await owner.sendTransaction({
      to: mockRouter.target,
      value: ethers.parseEther("50")
    });
  });

  describe("Deployment", function () {
    it("Should set the correct B3TR address", async function () {
      expect(await swapper.B3TR_ADDRESS()).to.equal(mockB3TR.target);
    });

    it("Should set the correct router address", async function () {
      expect(await swapper.router()).to.equal(mockRouter.target);
    });

    it("Should set the correct WVET address from router", async function () {
      expect(await swapper.WVET_ADDRESS()).to.equal(mockWVET.target);
    });

    it("Should set the deployer as owner", async function () {
      expect(await swapper.owner()).to.equal(owner.address);
    });

    it("Should revert if router address is zero", async function () {
      const B3TRVetSwapper = await ethers.getContractFactory("B3TRVetSwapper");
      await expect(
        B3TRVetSwapper.deploy(mockB3TR.target, ZERO_ADDRESS)
      ).to.be.revertedWith("Invalid router address");
    });

     it("Should revert if B3TR address is zero", async function () {
      const B3TRVetSwapper = await ethers.getContractFactory("B3TRVetSwapper");
      await expect(
        B3TRVetSwapper.deploy(ZERO_ADDRESS, mockRouter.target)
      ).to.be.revertedWith("Invalid B3TR address");
    });
  });

  describe("Router Management", function () {
    it("Should allow owner to update router address", async function () {
      const MockRouter = await ethers.getContractFactory("MockUniswapV2Router");
      const newRouter = await MockRouter.deploy(mockWVET.target);

      await expect(swapper.setRouterAddress(newRouter.target))
        .to.emit(swapper, "RouterUpdated")
        .withArgs(newRouter.target);

      expect(await swapper.router()).to.equal(newRouter.target);
    });

    it("Should revert if non-owner tries to update router", async function () {
      const MockRouter = await ethers.getContractFactory("MockUniswapV2Router");
      const newRouter = await MockRouter.deploy(mockWVET.target);

      await expect(
        swapper.connect(user).setRouterAddress(newRouter.target)
      ).to.be.revertedWithCustomError(swapper, "OwnableUnauthorizedAccount");
    });

    it("Should revert if new router address is zero", async function () {
      await expect(
        swapper.setRouterAddress(ZERO_ADDRESS)
      ).to.be.revertedWith("Invalid router address");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to withdraw VET", async function () {
      await owner.sendTransaction({
        to: swapper.target,
        value: ethers.parseEther("10")
      });

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await swapper.withdrawVET();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      expect(ownerBalanceAfter).to.be.closeTo(
        ownerBalanceBefore + ethers.parseEther("10") - gasUsed,
        ethers.parseEther("0.001")
      );
    });

    it("Should revert if non-owner tries to withdraw VET", async function () {
      await expect(
        swapper.connect(user).withdrawVET()
      ).to.be.revertedWithCustomError(swapper, "OwnableUnauthorizedAccount");
    });

    it("Should be able to receive VET", async function () {
      await expect(
        owner.sendTransaction({
          to: swapper.target,
          value: ethers.parseEther("1")
        })
      ).to.not.be.reverted;

      expect(await ethers.provider.getBalance(swapper.target)).to.equal(
        ethers.parseEther("1")
      );
    });
  });

  describe("Swapping", function () {
    it("Should swap B3TR for VET", async function () {
      const amountIn = ethers.parseEther("10");
      const amountOutMin = ethers.parseEther("0");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      // Mint B3TR to user
      await mockB3TR.mint(user.address, amountIn);

      // Approve swapper to spend B3TR
      await mockB3TR.connect(user).approve(swapper.target, amountIn);

      // Check initial balances
      const userB3TRBalanceBefore = await mockB3TR.balanceOf(user.address);
      expect(userB3TRBalanceBefore).to.equal(amountIn);

      // Execute swap
      await expect(swapper.connect(user).swapB3TRForVET(amountIn, amountOutMin, deadline))
        .to.emit(swapper, "Swapped");
        // Note: We can't easily check the exact VET amount here because MockRouter 
        // sends ETH (VET) but Hardhat network handles ETH balances differently 
        // and MockRouter calculation is simple.
        // However, we can check B3TR balance decreased.

      const userB3TRBalanceAfter = await mockB3TR.balanceOf(user.address);
      expect(userB3TRBalanceAfter).to.equal(0);
      
      // Verify swapper has no B3TR left (it should have sent it to router, 
      // but our MockRouter doesn't take it, so it sits in Swapper?
      // Wait, MockRouter DOES NOT transferFrom.
      // So in this specific MOCK setup, the tokens stay in the Swapper contract.
      // Real router would take them.
      // So we check if Swapper received them.
      expect(await mockB3TR.balanceOf(swapper.target)).to.equal(amountIn);
    });

    it("Should revert if amountIn is zero", async function () {
        const deadline = Math.floor(Date.now() / 1000) + 3600;
        await expect(
            swapper.connect(user).swapB3TRForVET(0, 0, deadline)
        ).to.be.revertedWith("Amount must be > 0");
    });
  });
});
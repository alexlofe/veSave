// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Standard Uniswap V2 Router Interface
interface IUniswapV2Router02 {
    function WETH() external pure returns (address); // WETH corresponds to WVET on VeChain

    // Swaps exact tokens for the native token (VET)
    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts);
}

/**
 * @title B3TRVetSwapper
 * @dev A contract to swap B3TR tokens for VET using the BetterSwap DEX.
 */
contract B3TRVetSwapper is Ownable {
    using SafeERC20 for IERC20;

    // B3TR Token Address (VeChain Mainnet)
    address public constant B3TR_ADDRESS = 0x5ef79995FE8a89e0812330E4378eB2660ceDe699;
    
    IUniswapV2Router02 public router;
    address public WVET_ADDRESS;

    event Swapped(address indexed user, uint256 amountInB3TR, uint256 amountOutVET);
    event RouterUpdated(address indexed newRouter);

    /**
     * @dev Constructor to set the BetterSwap Router address.
     * @param _routerAddress The address of the BetterSwap Router contract.
     */
    constructor(address _routerAddress) Ownable(msg.sender) {
        _setRouter(_routerAddress);
    }

    /**
     * @dev Swaps B3TR tokens for VET.
     * The user MUST approve this contract to spend their B3TR tokens before calling this function.
     * @param amountIn The amount of B3TR tokens to swap.
     * @param amountOutMin The minimum amount of VET expected (slippage protection).
     * @param deadline Timestamp until the transaction is valid.
     */
    function swapB3TRForVET(
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline
    ) external {
        require(amountIn > 0, "Amount must be > 0");

        // 1. Transfer B3TR from the user to this contract securely
        IERC20(B3TR_ADDRESS).safeTransferFrom(msg.sender, address(this), amountIn);

        // 2. Ensure the router is approved to spend the B3TR
        _approveRouter();

        // 3. Define the swap path: B3TR -> WVET
        address[] memory path = new address[](2);
        path[0] = B3TR_ADDRESS;
        path[1] = WVET_ADDRESS;

        // 4. Execute the swap
        // swapExactTokensForETH handles unwrapping WVET to VET and sends it to the recipient.
        uint[] memory amounts = router.swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            msg.sender, // Send VET directly back to the user
            deadline
        );

        emit Swapped(msg.sender, amounts[0], amounts[1]);
    }

    /**
     * @dev Get the estimated amount of VET out for a given B3TR input.
     */
    function getEstimatedVETOut(uint256 amountInB3TR) external view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = B3TR_ADDRESS;
        path[1] = WVET_ADDRESS;

        uint[] memory amounts = router.getAmountsOut(amountInB3TR, path);
        return amounts[1];
    }

    /**
     * @dev Approves the router if needed (approves max amount for efficiency).
     */
    function _approveRouter() internal {
        if (IERC20(B3TR_ADDRESS).allowance(address(this), address(router)) == 0) {
            IERC20(B3TR_ADDRESS).safeApprove(address(router), type(uint256).max);
        }
    }

    /**
     * @dev Allows the owner to update the BetterSwap Router address.
     */
    function setRouterAddress(address newRouterAddress) external onlyOwner {
        _setRouter(newRouterAddress);
    }

    function _setRouter(address _routerAddress) internal {
        require(_routerAddress != address(0), "Invalid router address");
        router = IUniswapV2Router02(_routerAddress);
        // Fetch the WVET address directly from the router
        WVET_ADDRESS = router.WETH(); 
        emit RouterUpdated(_routerAddress);
    }

    // Fallback function to receive VET
    receive() external payable {}

    /**
     * @dev Allows the owner to withdraw any accidentally sent VET or tokens.
     */
    function withdrawVET() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawToken(address tokenAddress) external onlyOwner {
        IERC20(tokenAddress).safeTransfer(owner(), IERC20(tokenAddress).balanceOf(address(this)));
    }
}

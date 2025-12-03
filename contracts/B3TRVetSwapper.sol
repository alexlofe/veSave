// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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
contract B3TRVetSwapper is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // B3TR Token Address
    address public immutable B3TR_ADDRESS;
    
    IUniswapV2Router02 public router;
    address public WVET_ADDRESS;

    event Swapped(address indexed user, uint256 amountInB3TR, uint256 amountOutVET);
    event RouterUpdated(address indexed newRouter);

    /**
     * @dev Constructor to set the B3TR address and BetterSwap Router address.
     * @param _b3trAddress The address of the B3TR token.
     * @param _routerAddress The address of the BetterSwap Router contract.
     */
    constructor(address _b3trAddress, address _routerAddress) Ownable(msg.sender) {
        require(_b3trAddress != address(0), "Invalid B3TR address");
        B3TR_ADDRESS = _b3trAddress;
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
    ) external nonReentrant {
        require(amountIn > 0, "Amount must be > 0");

        IERC20(B3TR_ADDRESS).safeTransferFrom(msg.sender, address(this), amountIn);

        _approveRouter();

        address[] memory path = new address[](2);
        path[0] = B3TR_ADDRESS;
        path[1] = WVET_ADDRESS;

        uint[] memory amounts = router.swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            msg.sender, 
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
        uint256 currentAllowance = IERC20(B3TR_ADDRESS).allowance(address(this), address(router));
        if (currentAllowance < type(uint256).max / 2) {
            IERC20(B3TR_ADDRESS).forceApprove(address(router), type(uint256).max);
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
        (bool ok, ) = payable(owner()).call{value: address(this).balance}("");
        require(ok, "VET transfer failed");
    }

    function withdrawToken(address tokenAddress) external onlyOwner {
        IERC20(tokenAddress).safeTransfer(owner(), IERC20(tokenAddress).balanceOf(address(this)));
    }
}

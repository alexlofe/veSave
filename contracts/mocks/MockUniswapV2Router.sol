// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockUniswapV2Router {
    address public immutable WETH;

    error InsufficientOutputAmount(uint256 amountOut, uint256 amountOutMin);
    error ExpiredDeadline(uint256 deadline, uint256 currentTime);
    error InvalidAmount();
    error InvalidPath();
    error ETHTransferFailed();
    error TokenTransferFailed();

    constructor(address _weth) {
        WETH = _weth;
    }

    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        if (deadline < block.timestamp) revert ExpiredDeadline(deadline, block.timestamp);
        if (amountIn == 0) revert InvalidAmount();
        if (path.length < 2) revert InvalidPath();

        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = (amountIn * 90) / 100;

        if (amounts[1] < amountOutMin) revert InsufficientOutputAmount(amounts[1], amountOutMin);

        if (!IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn)) {
            revert TokenTransferFailed();
        }

        (bool ok, ) = to.call{value: amounts[1]}("");
        if (!ok) revert ETHTransferFailed();

        return amounts;
    }

    function getAmountsOut(uint amountIn, address[] memory path) external pure returns (uint[] memory amounts) {
        if (path.length < 2) revert InvalidPath();
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        amounts[1] = (amountIn * 90) / 100;
    }

    receive() external payable {}
}

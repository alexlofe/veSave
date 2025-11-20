// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockUniswapV2Router {
    address public immutable WETH;

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
        require(deadline >= block.timestamp, "Expired");
        require(amountIn > 0, "Invalid amount");

        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = (amountIn * 90) / 100; // Simulate 10% slippage

        // Send ETH to recipient
        (bool success, ) = to.call{value: amounts[1]}("");
        require(success, "ETH transfer failed");

        return amounts;
    }

    function getAmountsOut(uint amountIn, address[] memory path) external pure returns (uint[] memory amounts) {
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        amounts[1] = (amountIn * 90) / 100; // Simulate 10% slippage
        return amounts;
    }

    receive() external payable {}
}

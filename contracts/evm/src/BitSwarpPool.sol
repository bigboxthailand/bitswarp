// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BitSwarpPool
 * @dev AI-Powered Multi-chain DEX Pool with enhanced security features.
 * Features: Reentrancy Guard, Circuit Breakers (Pause), and Strict Access Control.
 */
contract BitSwarpPool is ReentrancyGuard, Ownable, Pausable {
    address public aiExecutor;
    
    // token => user => balance
    mapping(address => mapping(address => uint256)) public balances;
    address public constant NATIVE_TOKEN = address(0);

    // Security Limits
    uint256 public maxSwapAmount = 10 ether; // Example safety cap

    event Deposited(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);
    event Swapped(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event AIExecutorUpdated(address indexed oldExecutor, address indexed newExecutor);

    error Unauthorized();
    error InsufficientBalance();
    error TransferFailed();
    error ExceedsMaxLimit();

    modifier onlyExecutor() {
        if (msg.sender != aiExecutor && msg.sender != owner()) revert Unauthorized();
        _;
    }

    constructor() Ownable(msg.sender) {
        aiExecutor = msg.sender;
    }

    // --- Admin Functions ---

    function setAIExecutor(address _executor) external onlyOwner {
        emit AIExecutorUpdated(aiExecutor, _executor);
        aiExecutor = _executor;
    }

    function setMaxSwapAmount(uint256 _amount) external onlyOwner {
        maxSwapAmount = _amount;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // --- Core Functions ---

    /**
     * @dev Deposit Native token (ETH/MONAD)
     */
    function deposit() external payable whenNotPaused {
        balances[NATIVE_TOKEN][msg.sender] += msg.value;
        emit Deposited(msg.sender, NATIVE_TOKEN, msg.value);
    }

    /**
     * @dev Deposit ERC20 token
     */
    function depositToken(address token, uint256 amount) external whenNotPaused nonReentrant {
        if (amount == 0) revert InsufficientBalance();
        
        uint256 balanceBefore = _getTokenBalance(token, address(this));
        
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), amount)
        );
        if (!success || (data.length > 0 && !abi.decode(data, (bool)))) revert TransferFailed();

        uint256 balanceAfter = _getTokenBalance(token, address(this));
        uint256 actualAmount = balanceAfter - balanceBefore; // Handle fee-on-transfer tokens

        balances[token][msg.sender] += actualAmount;
        emit Deposited(msg.sender, token, actualAmount);
    }

    /**
     * @dev Withdraw assets with Reentrancy protection
     */
    function withdraw(address token, uint256 amount) external nonReentrant {
        if (balances[token][msg.sender] < amount) revert InsufficientBalance();
        balances[token][msg.sender] -= amount;

        if (token == NATIVE_TOKEN) {
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            (bool success, bytes memory data) = token.call(
                abi.encodeWithSignature("transfer(address,uint256)", msg.sender, amount)
            );
            if (!success || (data.length > 0 && !abi.decode(data, (bool)))) revert TransferFailed();
        }

        emit Withdrawn(msg.sender, token, amount);
    }

    /**
     * @dev AI-facilitated swap with safety checks
     */
    function executeSwap(
        address user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) external onlyExecutor whenNotPaused nonReentrant {
        if (amountIn > maxSwapAmount) revert ExceedsMaxLimit();
        if (balances[tokenIn][user] < amountIn) revert InsufficientBalance();
        
        balances[tokenIn][user] -= amountIn;
        balances[tokenOut][user] += amountOut;

        emit Swapped(user, tokenIn, tokenOut, amountIn, amountOut);
    }

    function _getTokenBalance(address token, address account) internal view returns (uint256) {
        (bool success, bytes memory data) = token.staticcall(
            abi.encodeWithSignature("balanceOf(address)", account)
        );
        return success && data.length >= 32 ? abi.decode(data, (uint256)) : 0;
    }

    receive() external payable {
        balances[NATIVE_TOKEN][msg.sender] += msg.value;
    }
}

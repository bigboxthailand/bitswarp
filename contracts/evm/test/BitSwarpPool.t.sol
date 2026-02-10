// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {BitSwarpPool} from "../src/BitSwarpPool.sol";

contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) public {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract BitSwarpPoolTest is Test {
    BitSwarpPool public pool;
    MockERC20 public token;
    address public alice = address(0x1);
    address public aiAgent = address(0x2);

    function setUp() public {
        pool = new BitSwarpPool();
        token = new MockERC20();
        pool.setAIExecutor(aiAgent);
    }

    function test_DepositNative() public {
        vm.prank(alice);
        vm.deal(alice, 10 ether);
        pool.deposit{value: 1 ether}();
        assertEq(pool.balances(address(0), alice), 1 ether);
    }

    function test_DepositToken() public {
        token.mint(alice, 1000);
        vm.startPrank(alice);
        token.approve(address(pool), 500);
        pool.depositToken(address(token), 500);
        vm.stopPrank();

        assertEq(pool.balances(address(token), alice), 500);
        assertEq(token.balanceOf(address(pool)), 500);
    }

    function test_ExecuteSwap() public {
        // Setup Alice with some Native token
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        pool.deposit{value: 1 ether}();

        // AI Agent executes swap: 0.1 Native -> 100 MockToken
        vm.prank(aiAgent);
        pool.executeSwap(alice, address(0), address(token), 0.1 ether, 100);

        assertEq(pool.balances(address(0), alice), 0.9 ether);
        assertEq(pool.balances(address(token), alice), 100);
    }

    function test_UnauthorizedSwap() public {
        vm.prank(alice);
        vm.expectRevert();
        pool.executeSwap(alice, address(0), address(token), 0.1 ether, 100);
    }
}

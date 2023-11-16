// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract TransactionRelay is Pausable, Ownable {
    using SafeMath for uint256;

    uint256 public feePercentage = 1; // 1%
    uint256 public collectedFees;

    constructor(address initialOwner) Pausable() Ownable(initialOwner) {}

    // Function to Collect fee and relay transaction to receiver
    function relayTransaction(address payable receiver) public payable whenNotPaused {
        uint256 fee = msg.value.mul(feePercentage).div(100);
        uint256 amountToForward = msg.value.sub(fee);

        collectedFees = collectedFees.add(fee);

        // Send the rest of the funds to the receiver
        receiver.transfer(amountToForward);
    }

    // Function to update the fee percentage
    function updateFeePercentage(uint256 newFeePercentage) public onlyOwner {
        feePercentage = newFeePercentage;
    }

    // Function to withdraw the collected fees
    function withdrawFees() public onlyOwner {
        uint256 amount = collectedFees;
        collectedFees = 0;
        payable(owner()).transfer(amount);
    }

    // Function to pause the contract
    function pause() public onlyOwner {
        _pause();
    }

    // Function to unpause the contract
    function unpause() public onlyOwner {
        _unpause();
    }
}
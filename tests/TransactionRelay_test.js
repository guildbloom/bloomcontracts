const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TransactionRelay", function () {
  let TransactionRelay, relay, owner, addr1, addr2, addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    TransactionRelay = await ethers.getContractFactory("TransactionRelay");
    relay = await TransactionRelay.deploy(owner.address);
    await relay.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await relay.owner()).to.equal(owner.address);
    });

    it("Should have correct initial fee percentage", async function () {
      expect(await relay.feePercentage()).to.equal(1);
    });
  });

  describe("Transactions", function () {
    it("Should relay transactions and take a cut", async function () {
      let initialBalance = await ethers.provider.getBalance(addr2.address);

      // Send 1 ETH to the contract from addr1, relay to addr2
      await relay.connect(addr1).relayTransaction(addr2.address, { value: ethers.utils.parseEther("1") });

      let balance = await ethers.provider.getBalance(addr2.address);
      expect(balance).to.equal(initialBalance.add(ethers.utils.parseEther("0.99")));

      let collectedFees = await relay.collectedFees();
      expect(collectedFees).to.equal(ethers.utils.parseEther("0.01")); // 1% of 1 ETH
    });

    it("Should allow owner to withdraw fees", async function () {
      // Send 1 ETH to the contract from addr1, relay to addr2
      await relay.connect(addr1).relayTransaction(addr2.address, { value: ethers.utils.parseEther("1") });
      
      // Get owner's initial balance
      let initialBalance = await ethers.provider.getBalance(owner.address);

      // Owner withdraws fees
      await relay.withdrawFees();

      // Check owner's balance, it should have increased by 0.01 ETH
      let finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.at.least(initialBalance.add(ethers.utils.parseEther("0.009")));
    });
  });

  describe("Fee modification", function () {
    it("Should allow owner to modify fee percentage", async function () {
      await relay.updateFeePercentage(2);
      expect(await relay.feePercentage()).to.equal(2);
    });

    it("Should not allow non-owner to modify fee percentage", async function () {
        // Attempt to change the fee percentage from addr1 (which is not the owner)
        try {
          await relay.connect(addr1).modifyFeePercentage(5);
          expect.fail('Expected revert not received');
        } catch (error) {
          
          const revertReason = error.message;
          expect(revertReason.includes('Ownable: caller is not the owner'), `Expected "Ownable: caller is not the owner", but got ${revertReason}`);
        }
    });
  });
});
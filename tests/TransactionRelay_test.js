const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TransactionRelay", function() {
  let TransactionRelay, relay, owner, addr1, addr2, addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    TransactionRelay = await ethers.getContractFactory("TransactionRelay");
    relay = await TransactionRelay.deploy(owner.address);
    await relay.deployed();
  });

  describe("Deployment", function() {
    it("Should set the right owner", async function() {
      expect(await relay.owner()).to.equal(owner.address);
    });

    it("Should have correct initial fee percentage", async function() {
      expect(await relay.feePercentage()).to.equal(1);
    });
  });

  describe("Transactions", function() {
    it("Should relay transactions and take a cut", async function() {
      // Send 1 ETH to the contract from addr1, relay to addr2
      await relay.connect(addr1).relayTransaction(addr2.address, { value: ethers.utils.parseEther("1") });

      let balance = await ethers.provider.getBalance(addr2.address);
      expect(balance).to.equal(ethers.utils.parseEther("0.99")); // 1 ETH - 1% fee

      let collectedFees = await relay.collectedFees();
      expect(collectedFees).to.equal(ethers.utils.parseEther("0.01")); // 1% of 1 ETH
    });

    it("Should allow owner to withdraw fees", async function() {
      // Send 1 ETH to the contract from addr1, relay to addr2
      await relay.connect(addr1).relayTransaction(addr2.address, { value: ethers.utils.parseEther("1") });

      // Owner withdraws fees
      await relay.withdrawFees();

      let balance = await ethers.provider.getBalance(owner.address);
      // Balance should be increased by 0.01 ETH (1% of 1 ETH)
    });
  });

  describe("Fee modification", function() {
    it("Should allow owner to modify fee percentage", async function() {
      await relay.updateFeePercentage(2);
      expect(await relay.feePercentage()).to.equal(2);
    });

    it("Should not allow non-owner to modify fee percentage", async function() {
      await expect(relay.connect(addr1).updateFeePercentage(2)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
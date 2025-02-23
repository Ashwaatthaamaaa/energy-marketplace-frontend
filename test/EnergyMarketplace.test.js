const { expect } = require("chai");

describe("EnergyMarketplace", function () {
  let EnergyMarketplace, energyMarketplace, owner, addr1;

  beforeEach(async function () {
    EnergyMarketplace = await ethers.getContractFactory("EnergyMarketplace");
    [owner, addr1] = await ethers.getSigners();
    energyMarketplace = await EnergyMarketplace.deploy();
    await energyMarketplace.deployed();
  });

  it("Should list and buy energy", async function () {
    await energyMarketplace.listEnergy(10, ethers.utils.parseEther("0.01"));
    const listing = await energyMarketplace.listings(0);
    expect(listing.amount.toNumber()).to.equal(10);
    expect(listing.price).to.equal(ethers.utils.parseEther("0.01"));
    expect(listing.sold).to.be.false;

    await energyMarketplace.connect(addr1).buyEnergy(0, { value: ethers.utils.parseEther("0.01") });
    const updatedListing = await energyMarketplace.listings(0);
    expect(updatedListing.sold).to.be.true;
    expect(await energyMarketplace.balances(owner.address)).to.equal(ethers.utils.parseEther("0.01"));
  });
});
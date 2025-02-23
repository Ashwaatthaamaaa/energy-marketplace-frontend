const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("EnergyMarketplaceModule", (m) => {
  const energyMarketplace = m.contract("EnergyMarketplace");

  return { energyMarketplace };
});
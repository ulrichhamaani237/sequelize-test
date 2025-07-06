const MedicalConsensus = artifacts.require("MedicalConsensus");

module.exports = function (deployer) {
  deployer.deploy(MedicalConsensus);
};

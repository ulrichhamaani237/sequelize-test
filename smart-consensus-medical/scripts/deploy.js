const hre = require("hardhat");

async function main() {
  const ContractFactory = await hre.ethers.getContractFactory("MedicalConsensus"); // Remplace NomDuContrat

  const contract = await ContractFactory.deploy(); // Déploiement du contrat
  await contract.waitForDeployment(); // ✅ Méthode correcte depuis Hardhat 2.17+
  
  console.log("Contrat déployé à :", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// backend-nodejs/smart-consensus-medical/contract.service.js

const { Web3 } = require("web3");
const fs = require("fs");
const path = require("path");

// Connexion à Ganache
const web3 = new Web3("http://127.0.0.1:7545");

// Charger le contrat compilé (ABI + adresse déployée)
const contractJsonPath = path.resolve(__dirname, "../thruffle-consansus/build/contracts/MedicalConsensus.json");
const contractJson = JSON.parse(fs.readFileSync(contractJsonPath, "utf8"));

const abi = contractJson.abi;
const contractAddress = "0xb2E1083afCe43Cd4ab4C9781E316545B36dcCc0c"; 

const contract = new web3.eth.Contract(abi, contractAddress);

// Récupérer les comptes Ganache (facultatif : tu peux passer manuellement aussi)
async function getDefaultAccount() {
  const accounts = await web3.eth.getAccounts();
  return accounts[0];
}

// === Fonctions pour interagir avec le smart contract ===

// 1. Marquer le paiement comme effectué
async function marquerPaiement(consultationId) {
  const from = await getDefaultAccount();
  return await contract.methods.marquerPaiement(consultationId).send({ from });
}

// 2. Vérifier si un professionnel a accès au dossier d’un patient
async function verifierAcces(patientAddr, professionnelAddr) {
  return await contract.methods.verifierAcces(patientAddr, professionnelAddr).call();
}


// 3. Marquer une consultation comme validée en format FHIR
async function validerFormatFHIR(consultationId, estValide) {
  const from = await getDefaultAccount();
  return await contract.methods.validerFormatFHIR(consultationId, estValide).send({ from });
}

// 4. Soumettre un vote technique pour valider une opération
async function voterConsensus(blocId) {
  const from = await getDefaultAccount();
  return await contract.methods.voteTechnique(blocId).send({ from });
}

// 5. autoriser laccess a un dossier et emetre un evenement et une transaction
async function autoriserAcces(professionnelAddr, dureeMinutes) {
  const from = await getDefaultAccount();
  return await contract.methods.autoriserAcces(professionnelAddr, dureeMinutes).send({ from });
}

// Exporter les fonctions
module.exports = {
  marquerPaiement,
  verifierAcces,
  validerFormatFHIR,
  voterConsensus,
  autoriserAcces,
  web3
};

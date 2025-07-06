// consensus.service.js
const { Web3 } = require("web3"); 
const { abi } = require("../thruffle-consansus/build/contracts/MedicalConsensus.json");
const crypto = require("crypto");
const { ec: EC } = require("elliptic");
const ec = new EC("secp256k1");

// Configuration Ganache locale
const web3 = new Web3("http://127.0.0.1:7545");

// Adresse du contrat déployé (à remplacer par la tienne)
const CONTRACT_ADDRESS = "0x0c8348dC1aD2D6bF4a626F1947790D3958979D64"; // ✅ À mettre à jour !
const DEFAULT_ACCOUNT = "0x492CEF1D0a586EA45c7c2bfCbF8404bBe595D9ba"; // ✅ À mettre à jour !

const contract = new web3.eth.Contract(abi, CONTRACT_ADDRESS);

//------------------------------------------
// 1. Signer et vérifier un hash de consultation
//------------------------------------------
function signerEtVerifierConsultation(hashConsultation, privateKeyHex, publicKeyHex) {
  const messageHash = crypto.createHash("sha256").update(hashConsultation).digest();

  const privateKey = ec.keyFromPrivate(privateKeyHex, "hex");
  const publicKey = ec.keyFromPublic(publicKeyHex, "hex");

  const signature = privateKey.sign(messageHash);
  const isValid = publicKey.verify(messageHash, signature);

  return isValid;
}

//------------------------------------------
// 2. Ajouter une consultation (HASH only)
//------------------------------------------
async function ajouterConsultationBlockchain(idConsultation, hashConsultation) {
  try {
    const receipt = await contract.methods
      .ajouterConsultation(idConsultation, hashConsultation)
      .send({ from: DEFAULT_ACCOUNT, gas: 300000 });

    console.log("✔ Consultation ajoutée dans la blockchain", receipt.transactionHash);
    return receipt;
  } catch (error) {
    console.error("❌ Erreur ajout consultation blockchain:", error.message);
    throw error;
  }
}

//------------------------------------------
// 3. Marquer un paiement valide
//------------------------------------------
async function marquerPaiement(idConsultation) {
  try {
    await contract.methods
      .marquerPaiement(idConsultation)
      .send({ from: DEFAULT_ACCOUNT });
  } catch (error) {
    console.error("Erreur marquage paiement:", error.message);
    throw error;
  }
}

//------------------------------------------
// 4. Voter pour valider un bloc (consensus)
//------------------------------------------
async function voterConsensus(idConsultation) {
  try {
    await contract.methods
      .voteTechnique(idConsultation)
      .send({ from: DEFAULT_ACCOUNT });
  } catch (error) {
    console.error("Erreur vote consensus:", error.message);
    throw error;
  }
}

//------------------------------------------
// 5. Vérifier l'accès d'un professionnel
//------------------------------------------
async function verifierAcces(patientAddress, professionnelAddress) {
  try {
    const hasAccess = await contract.methods
      .verifierAcces(patientAddress, professionnelAddress)
      .call();

    return hasAccess;
  } catch (error) {
    console.error("Erreur vérification d'accès:", error.message);
    throw error;
  }
}

//------------------------------------------
// 6. Traiter l’ensemble des étapes en une transaction
//------------------------------------------
async function traiterConsultationComplete(idConsultation, hashConsultation, patientAddr, proAddr, blocId) {
  try {
    const gas = 500000;

    
    await contract.methods.ajouterConsultation(idConsultation, hashConsultation).send({ from: DEFAULT_ACCOUNT, gas });
    const receipt = await contract.methods.voteTechnique(blocId).send({ from: DEFAULT_ACCOUNT, gas });

    return receipt;
  } catch (error) {
    console.error("Erreur traitement complet de la consultation:", error.message);
    throw error;
  }
}

module.exports = {
  signerEtVerifierConsultation,
  ajouterConsultationBlockchain,
  marquerPaiement,
  voterConsensus,
  verifierAcces,
  traiterConsultationComplete,
};

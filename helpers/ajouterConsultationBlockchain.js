const { Web3 } = require("web3");
const fs = require("fs");
const path = require("path");
const web3 = new Web3("http://127.0.0.1:7545"); // Connexion à Ganache

// Charger le contrat compilé
const contractJSON = require(path.join(__dirname, "../thruffle-consansus/build/contracts/MedicalConsensus.json"));
const contractABI = contractJSON.abi;
const contractAddress = "0xaf654EFD2c86005eF102742c19BF952858647710"; 
const consensusContract = new web3.eth.Contract(contractABI, contractAddress);

/// Clé privée pour signer les transactions (à stocker de façon sécurisée en prod)
const PRIVATE_KEY = "0x1727d40e71229d432e9bb0fd843026b9a9a521fc6edc79916477d87bfb86c971"; 
const PUBLIC_ADDRESS = "0x492CEF1D0a586EA45c7c2bfCbF8404bBe595D9ba"; 

// 🔁 Module principal
const ajouterConsultationBlockchain = async ({
  idConsultation,
  hashConsultation,
  addressProfessionnel,
  addressPatient,
  estFhirValide
}) => {
  try {
    console.log("⛓ Interaction avec le smart contract en cours...");

    // 1. Vérifier que l'accès est autorisé (on pourrait aussi appeler la méthode `verifierAcces()` côté client si lecture simple)
    const accesOk = await consensusContract.methods.verifierAcces(addressPatient, addressProfessionnel).call();
    if (!accesOk) {
      throw new Error("Accès non autorisé pour ce professionnel.");
    }

    // 2. Marquer que le paiement a été effectué
    await consensusContract.methods.marquerPaiement(idConsultation).send({ from: PUBLIC_ADDRESS });

    // 3. Valider le format FHIR
    await consensusContract.methods.validerFormatFHIR(idConsultation, estFhirValide).send({ from: PUBLIC_ADDRESS });

    // 4. Ajouter la consultation (uniquement hash stocké)
    await consensusContract.methods.ajouterConsultation(idConsultation, hashConsultation).send({ from: PUBLIC_ADDRESS });

    // 5. Voter pour le consensus (validation technique)
    await consensusContract.methods.voteTechnique(idConsultation).send({ from: PUBLIC_ADDRESS });

    console.log("✅ Toutes les opérations blockchain ont été exécutées avec succès.");
    return { success: true, message: "Consultation ajoutée et distribuée avec consensus" };
  } catch (error) {
    console.error("❌ Erreur Blockchain:", error);
    return { success: false, error: error.message };
  }
};

module.exports = ajouterConsultationBlockchain;

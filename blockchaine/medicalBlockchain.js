const express = require('express')
const bodyParser = require('body-parser')
const { Block, PendingRecord, Node, AccessLog } = require("./db");
const { ec: EC } = require("elliptic");
const CryptoJS = require("crypto-js");
const SHA256 = require("crypto-js/sha256");
const dotenv = require("dotenv");
dotenv.config();

const ec = new EC("secp256k1"); // Courbe utilisée par Bitcoin

const app = express();
app.use(bodyParser.json());

const port = process.env.BLOCKCHAIN_PORT || 3001;

const myUrl = `http://localhost:${port}`;

/**
 * @description fonction pour calculer le hash  d un block
 * @param {*} index index du block
 * @param {*} previousHash hash du block précédent
 * @param {*} timestamp timestamp du block
 * @param {*} data données du block
 * @returns hash du block
 * 
 */
function calculateHash(index, timestamp, data, previousHash) {
    return SHA256(index + previousHash + timestamp + JSON.stringify(data)).toString();
}
/**
 * @description fonction pour créer le block genesis
 * @returns block genesis
 * @throws {Error} Si le block genesis existe déjà
 * @alias createGenesisBlock
 * @example
 * createGenesisBlock();
 * 
 */
async function createGenesisBlock() {
    const existingBlocks = await Block.find();
    if (existingBlocks.length === 0) {
        const genesisBlock = new Block({
            index: 0,
            timestamp: new Date(),
            previousHash: "0",
            hash: calculateHash(0, new Date(), { dossier: "Genesis Block" }, "0"),
            data: [],
        });
        await genesisBlock.save();
        console.log("Genesis block created");
    }
}

/**
 * Enregistre un dossier médical signé et chiffré dans la mempool blockchain.
 *
 * @param {Object} dossier - Les données médicales brutes.
 * @param {string} signature - Signature ECDSA hex (format DER).
 * @param {string} publicKey - Clé publique hex.
 * @param {string} secretKey - Clé AES pour chiffrer les données.
 * @returns {Promise<{ success?: string, error?: string }>}
 */
async function addrecordBlockchain(dossier, signature, publicKey, secretKey) {

    try {
        if (!dossier || !signature || !publicKey || !secretKey) {
            return { error: "donnee manquantes" }
        }
        // verification de la signature 

        const dataStr = JSON.stringify(dossier)
        const dataHash = SHA256(dataStr).toString()
        const key = ec.keyFromPublic(publicKey, "hex");

        if (!key.verify(dataHash, signature)) {
            return { error: "Signature invalide !" };
        }

        // 2. Chiffrer les données
        const dossierChiffre = CryptoJS.AES.encrypt(dataStr, secretKey).toString();

        // 3. Enregistrer dans MongoDB (mempool)
        const pendingRecord = new PendingRecord({
            dossier: dossierChiffre,
            signature,
            publicKey,
        });
        await pendingRecord.save();

        return { success: true, message: "Enregistrement en attente" }
    } catch (error) {
        return { error: error.message }
    }

}

/**
 * Mine un nouveau bloc à partir des dossiers en attente et l'ajoute à la blockchain.
 * Supprime les enregistrements en attente et synchronise avec les autres nœuds.
 * 
 * @returns {Promise<{ success?: string, block?: object, error?: string }>}
 */
async function mineNewBlock() {
    try {
      // 1. Récupérer les enregistrements en attente
      const pendingRecords = await PendingRecord.find();
      if (pendingRecords.length === 0) {
        return { error: "Aucun dossier à valider." };
      }
  
      // 2. Récupérer le dernier bloc
      const latestBlock = await Block.findOne().sort({ index: -1 });
      const newIndex = latestBlock ? latestBlock.index + 1 : 1;
      const timestamp = new Date();
      const previousHash = latestBlock ? latestBlock.hash : "0";
  
      // 3. Préparer les données du bloc
      const data = pendingRecords.map(record => ({
        dossier: record.dossier,
        signature: record.signature,
        publicKey: record.publicKey,
      }));
  
      // 4. Calculer le hash
      const hash = calculateHash(newIndex, timestamp, data, previousHash);
  
      // 5. Créer et sauvegarder le bloc
      const newBlock = new Block({
        index: newIndex,
        timestamp,
        previousHash,
        hash,
        data,
      });
  
      await newBlock.save();
  
      // 6. Nettoyer la mempool (transactions en attente)
      await PendingRecord.deleteMany();
  
      // 7. Synchronisation avec les autres nœuds
      const nodes = await Node.find();
      for (const node of nodes) {
        try {
          await axios.post(`${node.url}/update-chain`, { newBlock });
        } catch (err) {
          console.error(`Erreur de synchronisation avec ${node.url}`);
        }
      }
  
      return { success: "Nouveau bloc miné avec succès.", block: newBlock };
    } catch (err) {
      console.error("Erreur lors du minage :", err);
      return { error: "Erreur serveur lors du minage." };
    }
  }


  /**
 * Met à jour la blockchain locale avec un nouveau bloc reçu du réseau.
 * 
 * @param {Object} newBlock - Les données complètes du bloc (doit déjà être hashé).
 * @returns {Promise<{ success?: string, error?: string }>}
 * 
 */
async function updateBlockchain(newBlock) {
    if (!newBlock) {
      return {error: "Bloc manquant."} ;
    }
  
    const existingBlock = await Block.findOne({ index: newBlock.index });
    if (existingBlock) {
      return { error: "Bloc déjà existant." };
    }
  
    const block = new Block(newBlock);
    await block.save();
  
    return { success: "Blockchain mise à jour." };
  }


/**
 * Calcule un hash SHA256 du bloc.
 */
function calculateHash(index, timestamp, data, previousHash) {
  return SHA256(index + timestamp + JSON.stringify(data) + previousHash).toString();
}

/**
 * Vérifie l'intégrité de toute la blockchain (hashs, liens, signatures).
 * 
 * @returns {Promise<{ isValid: boolean, error?: string }>}
 */
async function validateBlockchain() {
  const blocks = await Block.find().sort({ index: 1 });
  if (blocks.length === 0) return { isValid: false, error: "Blockchain vide." };

  for (let i = 1; i < blocks.length; i++) {
    const currentBlock = blocks[i];
    const previousBlock = blocks[i - 1];

    // Vérifie que le hash correspond aux données du bloc
    const recalculatedHash = calculateHash(
      currentBlock.index,
      currentBlock.timestamp,
      currentBlock.data,
      currentBlock.previousHash
    );
    if (currentBlock.hash !== recalculatedHash) {
      return { isValid: false, error: "Hash invalide au bloc " + currentBlock.index };
    }

    // Vérifie le lien avec le bloc précédent
    if (currentBlock.previousHash !== previousBlock.hash) {
      return { isValid: false, error: "Lien de hash rompu au bloc " + currentBlock.index };
    }

    // Vérifie chaque signature de dossier médical
    for (const record of currentBlock.data) {
      try {
        const decryptedData = CryptoJS.AES.decrypt(record.dossier, "secretKey").toString(CryptoJS.enc.Utf8);
        const dataHash = SHA256(decryptedData).toString();
        const key = ec.keyFromPublic(record.publicKey, "hex");

        if (!key.verify(dataHash, record.signature)) {
          return { isValid: false, error: "Signature invalide au bloc " + currentBlock.index };
        }
      } catch (err) {
        return { isValid: false, error: "Erreur de déchiffrement au bloc " + currentBlock.index };
      }
    }
  }

  return { isValid: true };
}

/**
 * Récupère la blockchain complète.
 * 
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 * @returns {Promise<void>}
 */
async function getBlockchain(req, res) {
    const blocks = await Block.find().sort({ index: 1 });
    return res.json(blocks);
}

/**
 * Enregistre un nouveau nœud dans la blockchain.
 * 
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 * @returns {Promise<void>}
 */
async function registerNode(req, res) {
    const { nodeUrl } = req.body;
  
    // 1. Vérifie que l'URL du nœud est présente
    if (!nodeUrl) {
      return res.status(400).json({ error: "URL du nœud manquante." });
    }
  
    // 2. Vérifie si ce nœud est déjà enregistré
    const existingNode = await Node.findOne({ url: nodeUrl });
    if (existingNode) {
      return res.status(400).json({ error: "Nœud déjà enregistré." });
    }
  
    // 3. Enregistre le nouveau nœud
    const node = new Node({ url: nodeUrl });
    await node.save();
  
    res.json({ success: "Nœud enregistré !" });
  }
  
module.exports = {
    createGenesisBlock,
    addrecordBlockchain,
    mineNewBlock,
    validateBlockchain,
    getBlockchain,
    registerNode
}


  
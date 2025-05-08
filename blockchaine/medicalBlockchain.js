// ==============================================
// Dépendances
// ==============================================
const EC = require('elliptic').ec;
const ec = new EC('secp256k1'); // Cryptographie ECC
const SHA256 = require('crypto-js/sha256'); // Hashing
const express = require('express'); // Serveur web
const bodyParser = require('body-parser'); // Parser JSON
const { v4: uuidv4 } = require('uuid'); // Génération d'IDs uniques

// ==============================================
// Classes Blockchain
// ==============================================
class MedicalRecord {
  
  constructor(patientId, doctorId, data) {
    this.recordId = uuidv4();
    this.patientId = patientId;
    this.doctorId = doctorId;
    this.data = data;
    this.timestamp = Date.now();
  }

}

class Block {
  constructor(index, timestamp, records, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.records = records;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return SHA256(
      this.index +
      this.timestamp +
      JSON.stringify(this.records) +
      this.previousHash +
      this.nonce
    ).toString();
  }

  mineBlock(difficulty) {
    console.log('⛏️  Minage du bloc en cours...');
    while (this.hash.substring(0, difficulty) !== '0'.repeat(difficulty)) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`✅ Bloc miné: ${this.hash}`);
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingRecords = [];
    this.difficulty = 3;
    this.networkNodes = [];
  }

  createGenesisBlock() {
    return new Block(0, Date.now(), [{
      record: { patientId: 'genesis', doctorId: 'system', data: {} },
      signature: { r: '0', s: '0' },
      publicKey: '04'
    }], '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addNewRecord(record, signature, publicKey) {
    // Vérification de la signature
    const dataHash = SHA256(JSON.stringify(record)).toString();
    const key = ec.keyFromPublic(publicKey, 'hex');
    
    if (!key.verify(dataHash, signature)) {
      throw new Error('❗ Signature invalide');
    }

    this.pendingRecords.push({ record, signature, publicKey });
    console.log('📝 Dossier médical ajouté en attente');
  }

  minePendingRecords() {
    if (this.pendingRecords.length === 0) {
      console.log('⚠️  Aucun dossier à miner');
      return;
    }

    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      this.pendingRecords,
      this.getLatestBlock().hash
    );
    
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
    this.pendingRecords = [];
    console.log(`🆕 Bloc #${newBlock.index} ajouté à la chaine`);
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;

      for (const rec of current.records) {
        const hash = SHA256(JSON.stringify(rec.record)).toString();
        const key = ec.keyFromPublic(rec.publicKey, 'hex');
        if (!key.verify(hash, rec.signature)) return false;
      }
    }
    return true;
  }
}

// ==============================================
// Configuration du Serveur
// ==============================================
const app = express();
app.use(bodyParser.json());

const port = process.argv[2] || 3000;
const nodeAddress = `http://localhost:${port}`;

const medicalChain = new Blockchain();

// ==============================================
// Endpoints API
// ==============================================
// Ajouter un dossier
app.post('/record', (req, res) => {
  try {
    medicalChain.addNewRecord(
      req.body.record,
      req.body.signature,
      req.body.publicKey
    );
    res.json({ success: true, message: 'Dossier en attente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Miner les dossiers en attente
app.get('/mine', (req, res) => {
  medicalChain.minePendingRecords();
  res.json({
    success: true,
    block: medicalChain.getLatestBlock()
  });
});

// Voir la chaine
app.get('/chain', (req, res) => {
  res.json({
    chain: medicalChain.chain,
    length: medicalChain.chain.length,
    isValid: medicalChain.isChainValid()
  });
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`🏥 Blockchain Médicale active sur ${nodeAddress}`);
  console.log('\nCommandes disponibles:');
  console.log(`1. POST ${nodeAddress}/record - Ajouter un dossier`);
  console.log(`2. GET ${nodeAddress}/mine - Miner les dossiers`);
  console.log(`3. GET ${nodeAddress}/chain - Voir la chaine`);
});

// ==============================================
// Fonctions Utilitaires
// ==============================================
function generateKeys() {
  const keyPair = ec.genKeyPair();
  return {
    privateKey: keyPair.getPrivate('hex'),
    publicKey: keyPair.getPublic('hex')
  };
}

function signRecord(privateKey, record) {
  const keyPair = ec.keyFromPrivate(privateKey, 'hex');
  const hash = SHA256(JSON.stringify(record)).toString();
  const signature = keyPair.sign(hash);
  return {
    r: signature.r.toString(16),
    s: signature.s.toString(16),
    recoveryParam: signature.recoveryParam
  };
}

// ==============================================
// Exemple d'Utilisation
// ==============================================
console.log('\nExemple de génération de clés:');
const keys = generateKeys();
console.log('Clé privée:', keys.privateKey);
console.log('Clé publique:', keys.publicKey);

console.log('\nExemple de création de signature:');
const sampleRecord = new MedicalRecord('patient1', 'doctor1', { diagnosis: 'COVID-19' });
const signature = signRecord(keys.privateKey, sampleRecord);
console.log('Signature:', signature);
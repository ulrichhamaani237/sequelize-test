const mongoose = require("mongoose");



// Encodez le caractère spécial '@' dans le mot de passe
const DB_URI = "mongodb+srv://ulrich_dev:%2B237Ulrich@cluster0.yozxkoq.mongodb.net/medicalchain?retryWrites=true&w=majority";

mongoose.connect(DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  tlsAllowInvalidCertificates: false // À n'utiliser qu'en développement
})
.then(() => console.log('Connexion MongoDB réussie ✅'))
.catch(err => console.error('Erreur de connexion ❌:', err.message));

// Schéma des blocs de la blockchain
const BlockSchema = new mongoose.Schema({
  index: Number,
  timestamp: Date,
  previousHash: String,
  hash: String,
  data: [
    {
      dossier: Object,         // Contenu du dossier médical (chiffré)
      signature: String,       // Signature ECDSA du créateur
      publicKey: String        // Clé publique du signataire
    }
  ]
});
const Block = mongoose.model("Block", BlockSchema);

// Schéma pour les dossiers en attente de validation (pool de transactions)
const PendingRecordSchema = new mongoose.Schema({
  dossier: Object,
  signature: String,
  publicKey: String,
  timestamp: { type: Date, default: Date.now }
});
const PendingRecord = mongoose.model("PendingRecord", PendingRecordSchema);

// Schéma pour les nœuds du réseau
const NodeSchema = new mongoose.Schema({
  url: { type: String, unique: true }
});
const Node = mongoose.model("Node", NodeSchema);

// Schéma pour les logs d'accès aux dossiers (audit trail)
const AccessLogSchema = new mongoose.Schema({
  patientId: String,
  action: { type: String, enum: ["READ", "WRITE", "MODIFY", "DELETE"] },
  by: String,                 // Clé publique de l'acteur
  timestamp: { type: Date, default: Date.now },
  blockIndex: Number
});
const AccessLog = mongoose.model("AccessLog", AccessLogSchema);

// Export des modèles
module.exports = {
  Block,
  PendingRecord,
  Node,
  AccessLog
};

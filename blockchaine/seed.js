const mongoose = require("mongoose");
const { Block, PendingRecord, Node, AccessLog } = require("./db");

async function seedData() {
  try {
    // Insérer un bloc de test
    const testBlock = new Block({
      index: 0,
      timestamp: new Date(),
      previousHash: "0",
      hash: "test-hash",
      data: [{
        dossier: { test: "dossier test" },
        signature: "test-signature",
        publicKey: "test-public-key"
      }]
    });
    await testBlock.save();

    // Insérer un enregistrement en attente
    const pendingRecord = new PendingRecord({
      dossier: { test: "pending dossier" },
      signature: "pending-signature",
      publicKey: "pending-public-key"
    });
    await pendingRecord.save();

    // Insérer un nœud
    const node = new Node({
      url: "http://localhost:3000"
    });
    await node.save();

    // Insérer un log d'accès
    const accessLog = new AccessLog({
      patientId: "test-patient",
      action: "READ",
      by: "test-public-key",
      blockIndex: 0
    });
    await accessLog.save();

    console.log("Données insérées avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'insertion des données :", error);
  } finally {
    mongoose.connection.close();
  }
}

seedData();
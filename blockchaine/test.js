const EC = require("elliptic").ec;
const ec = new EC("secp256k1"); // Courbe utilisée par Bitcoin (efficace)

// 1. Un médecin génère sa clé privée/publique
const doctorKey = ec.genKeyPair();
const doctorPrivateKey = doctorKey.getPrivate("hex");
const doctorPublicKey = doctorKey.getPublic("hex");

// 2. Le médecin signe un dossier médical (hashé)
const medicalRecord = { patient: "Alice", diagnosis: "COVID-19" };
const recordHash = SHA256(JSON.stringify(medicalRecord)).toString(); // (utilise crypto-js pour le hash)
const signature = doctorKey.sign(recordHash);

// 3. Vérification par l'hôpital
const isValid = ec.verify(recordHash, signature, doctorPublicKey);
console.log("La signature est valide ?", isValid); // true si non altéré
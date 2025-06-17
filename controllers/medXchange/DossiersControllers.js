require("dotenv").config();
const { query } = require("../../config/db");
const { sendNotification } = require("./notification");
const { addLogs } = require("./LogsControllers");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const moment = require('moment');
const { createGenesisBlock, addrecordBlockchain } = require("../../blockchaine/medicalBlockchain");
const { SHA256 } = require("crypto-js");
const { ec: EC } = require("elliptic");
const ec = new EC("secp256k1");
const crypto = require("crypto");
const jwt = require('jsonwebtoken');
const { sendSms } = require("../../helpers/sendMessage");
const CryptoJS = require("crypto-js");




/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns  
 * 
 */
const addPersonnel = async (req, res) => {
  try {

    const {
      nom,
      prenom,
      email,
      mot_de_passe_hash,
      role,
      sexe,
      specialite } = req.body;

    const id_hopital = req.params.id_hopital;

    if (!nom || !prenom || !email || !mot_de_passe_hash || !role || !id_hopital || !specialite || !sexe) {
      return res.status(400).json({ success: false, message: "Tous les champs sont obligatoires" });
    }

    const motDePasseHash = await bcrypt.hash(mot_de_passe_hash, 10);

    const personnel = await query(
      `INSERT INTO utilisateur(nom, prenom, email,mot_de_passe_hash,role,id_hopital,specialite,sexe)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
      `,
      [nom, prenom, email, motDePasseHash, role, id_hopital, specialite, sexe]
    )

    if (!personnel.rows.length) {
      return res.status(400).json({
        success: false,
        message: "erreur lors de l inserton"
      })
    }

    return res.status(201).json({
      success: true,
      message: "Personnel ajouté avec succès",
      personnel: personnel.rows[0]
    })

  } catch (error) {
    console.error("Erreur lors de l'ajout du personnel:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de l'ajout du personnel" });
  }
}

/**
 * @description 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getPersonnelById = async (req, res) => {
  try {
    const { id_utilisateur } = req.params;
    const personnel = await query(
      `SELECT * FROM utilisateur WHERE id_utilisateur = $1`,
      [id_utilisateur]
    );
    if (!personnel.rows.length) {
      return res.status(404).json({ success: false, message: "Personnel non trouvé" });
    }
    return res.status(200).json({ success: true, message: "Personnel trouvé avec succès", personnel: personnel.rows[0] });
  } catch (error) {
    console.error("Erreur lors de la recherche du personnel:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la recherche du personnel" });
  }
}

/**
 * @description edit personnel
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const editPersonnel = async (req, res) => {
  try {
    const { nom, prenom, email, role, specialite, sexe } = req.body;
    const id_utilisateur = req.params.id_utilisateur;
    const personnel = await query(
      `UPDATE utilisateur SET nom = $1, prenom = $2, email = $3, role = $4, specialite = $5,sexe = $6 WHERE id_utilisateur = $7 RETURNING *`,
      [nom, prenom, email, role, specialite, sexe, id_utilisateur]
    );
    if (!personnel.rows.length) {
      return res.status(404).json({ success: false, message: "Personnel non trouvé" });
    }
    return res.status(200).json({ success: true, message: "Personnel modifié avec succès", personnel: personnel.rows[0] });
  } catch (error) {
    console.error("Erreur lors de la modification du personnel:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la modification du personnel" });
  }
}

const setActivePersonnel = async (req, res) => {
  try {
    const id_utilisateur = req.params.id_utilisateur;
    const personnel = await query(
      `UPDATE utilisateur SET is_not_active = $1 WHERE id_utilisateur = $2 RETURNING *`,
      [true, id_utilisateur]
    );
    if (!personnel.rows.length) {
      return res.status(404).json({ success: false, message: "Personnel non trouvé" });
    }
    return res.status(200).json({ success: true, message: "Personnel activé avec succès", personnel: personnel.rows[0] });
  } catch (error) {
    console.error("Erreur lors de l'activation du personnel:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de l'activation du personnel" });
  }
}

const setInactivePersonnel = async (req, res) => {
  try {
    const id_utilisateur = req.params.id_utilisateur;
    const personnel = await query(
      `UPDATE utilisateur SET is_not_active = $1 WHERE id_utilisateur = $2 RETURNING *`,
      [false, id_utilisateur]
    );
    if (!personnel.rows.length) {
      return res.status(404).json({ success: false, message: "Personnel non trouvé" });
    }
    return res.status(200).json({ success: true, message: "Personnel desactivé avec succès", personnel: personnel.rows[0] });
  } catch (error) {
    console.error("Erreur lors de la desactivation du personnel:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la desactivation du personnel" });
  }
}


/**
 * @description fonction pour ajouter un patient et enregistrer dans la blockchaine
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const generateCodeAccess = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 chiffres
};

const addPatient = async (req, res) => {
  try {
    const {
      nom, prenom, date_naissance, sexe, taille, email,
      adresse, nom_tuteur, photo, id_utilisateur, mot_de_passe, tel,
      is_paid, password
    } = req.body;
    const id_hopital = req.params.id_hopital;
    const code_access = generateCodeAccess();
    const code_access_hash = await bcrypt.hash(code_access, 10);

    const requiredFields = {
      id_hopital, nom, prenom, date_naissance, sexe, taille,
      adresse, nom_tuteur, id_utilisateur, mot_de_passe, tel, email, password
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Champs manquants: ${missingFields.join(', ')}`
      });
    }

    const userCheck = await query('SELECT * FROM utilisateur WHERE id_utilisateur = $1', [id_utilisateur]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "L'utilisateur spécifié n'existe pas" });
    }

    const user = userCheck.rows[0];

    const validPassword = await bcrypt.compare(password, user.mot_de_passe_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Déchiffrement de la clé privée
    let decryptedPrivateKey;
    try {
      const encryptedData = user.cle_prive;
      const [saltHex, ivHex, encryptedKey] = encryptedData.split(':');
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const derivedKey = crypto.scryptSync(password, salt, 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
      decryptedPrivateKey = decipher.update(encryptedKey, 'hex', 'utf8') + decipher.final('utf8');

      if (!/^[0-9a-fA-F]+$/.test(decryptedPrivateKey)) {
        return res.status(400).json({ success: false, message: 'Clé privée invalide après déchiffrement' });
      }
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Erreur lors du déchiffrement de la clé privée' });
    }

    // Envoi du SMS avec le code d'accès en clair
    try {
      const message = `Bonjour ${prenom}, votre code d'accès au dossier médical est : ${code_access}`;
      await sendSms(tel, message);
    } catch (smsError) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi du SMS",
        error: smsError.message
      });
    }

    const age = moment().diff(date_naissance, 'years');

    // Insertion du patient avec le hash du code d'accès
    const patientInsert = await query(`
      INSERT INTO patient 
      (nom, prenom, date_naissance, nom_tuteur, id_hopital, adresse, 
      sexe, age, taille, photo, tel, email, password, is_paid, code_access)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [nom, prenom, date_naissance, nom_tuteur, id_hopital, adresse, sexe, age,
        taille, photo, tel, email, hashedPassword, is_paid ?? false, code_access_hash]
    );

    const patient = patientInsert.rows[0];

    // Création du dossier médical et consultation
    const newDossier = await query(`
      INSERT INTO dossier_medical_global 
      (id_patient, id_hopital, date_creation, derniere_modification)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *`, [patient.id_patient, id_hopital]);

    const dossier = newDossier.rows[0];

    const detailInit = JSON.stringify({
      type: 'Initiale',
      date: new Date(),
      detail: 'Aucune consultation créée pour le moment!'
    });

    const consultation = await query(`
      INSERT INTO consultation 
      (id_dossier, id_utilisateur, date_consultation, detail)
      VALUES ($1, $2, $3, $4)
      RETURNING *`, [dossier.id_dossier, id_utilisateur, new Date(), detailInit]);

    // Préparer données à enregistrer dans la blockchain
    const blockChainData = {
      type: 'Initiale',
      date: new Date().toISOString(),
      detail: 'Création du dossier médical',
      id_dossier: dossier.id_dossier,
      id_utilisateur: id_utilisateur,
      action: 'creation_dossier'
    };

    const transaction = `Creation du dossier medical - Patient: ${patient.nom} ${patient.prenom} - ${new Date().toISOString()}`;

    // Sérialiser le bloc en clair (chaîne JSON stable)
    const blockDataString = JSON.stringify(blockChainData);

    // Calcul du hash du message à signer
    const messageHash = crypto.createHash('sha256').update(blockDataString).digest();

    // Génération de la signature à partir de la clé privée déchiffrée
    const privateKey = ec.keyFromPrivate(decryptedPrivateKey, 'hex');
    const signature = privateKey.sign(messageHash).toDER('hex');

    // Vérification avec la clé publique
    const publicKey = ec.keyFromPublic(user.cle_publique, 'hex');
    const isVerified = publicKey.verify(messageHash, signature);

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: "Échec de la vérification de la signature sur les données du bloc"
      });
    }

    // Enregistrement dans la blockchain
    const result = await addrecordBlockchain(
      blockChainData,
      transaction,
      signature,
      user.cle_publique,
      decryptedPrivateKey
    );

    return res.status(201).json({
      success: true,
      message: "Patient et dossier médical créés avec succès",
      data: {
        ...patient,
        dossier,
        consultation: consultation.rows[0]
      },
      mined: result
    });

  } catch (error) {
    console.error("Erreur dans addPatient:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};


const loginpatient = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    if (!email || !mot_de_passe) {
      return res.status(400).json({ success: false, message: "Tous les champs sont obligatoires" });
    }
    const utilisateur = await query(
      `SELECT * FROM patient WHERE email = $1`,
      [email]
    );
    if (!utilisateur.rows.length) {
      return res.status(404).json({ success: false, message: "Patient non trouvé" });
    }
    const utilisateurData = utilisateur.rows[0];
    console.log("Utilisateur trouvé :", utilisateurData);

    // Vérifie que le champ du mot de passe existe
    if (!utilisateurData.password) {
      console.error("Champ password manquant dans la base de données");
      return res.status(500).json({ success: false, message: "Erreur interne: champ password manquant" });
    }

    const motDePasseHash = await bcrypt.compare(mot_de_passe, utilisateurData.password);
    if (!motDePasseHash) {
      return res.status(401).json({ success: false, message: "Mot de passe incorrect" });
    }
    if (!process.env.TOKEN_KEY) {
      console.error("TOKEN_KEY non défini dans les variables d'environnement");
      return res.status(500).json({ success: false, message: "Erreur de configuration du serveur" });
    }
    const token = jwt.sign({ id_patient: utilisateurData.id_patient }, process.env.TOKEN_KEY, { expiresIn: '10d' });
    const updatetoken = await query(
      `UPDATE patient SET token = $1 WHERE id_patient = $2 RETURNING *`,
      [token, utilisateurData.id_patient]
    );
    if (!updatetoken.rows.length) {
      return res.status(404).json({ success: false, message: "Patient non trouvé" });
    }
    return res.status(200).json({ success: true, message: "Connexion reussie", utilisateur: utilisateurData, token });
  } catch (error) {
    console.error("Erreur lors de la connexion du patinent:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la connexion" });
  }
}



const getPrestatairepatient = async (req, res) => {
  try {

    const { id_patient } = req.body
    if (!id_patient) {
      return res.status(400).json({
        success: false,
        message: "champs id_patient requise"
      })
    }

    const prestatairePatient = await query(`
      SELECT FROM utilisateur WHERE id_patient = $1`,
      [id_patient]
    )
    if (!prestatairePatient.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Prestataire non trouvé"
      })
    }
    return res.status(200).json({
      success: true,
      message: "Prestataire trouvé",
      prestataire: prestatairePatient.rows[0]
    })
  } catch (error) {
    console.error("Erreur lors de la récupération du prestataire:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du prestataire"
    })
  }
}

const dossierforpatient = async (req, res) => {

  try {
    const { id_patient } = req.body
    if (!id_patient) {
      return res.status(400).json({
        success: false,
        message: "champs id_patient requise"
      })
    }
    const dossierPatient = await query(`
      SELECT C.detail FROM consultation as C
      JOIN patient as P ON C.id_patient = P.id_patient
      WHERE P.id_patient = $1`,
      [id_patient]
    )
    if (!dossierPatient.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Dossier non trouvé"
      })
    }
    return res.status(200).json({
      success: true,
      message: "Dossier trouvé",
      dossier: dossierPatient.rows[0]
    })
  } catch (error) {
    console.error("Erreur lors de la récupération du dossier:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du dossier"
    })
  }
}

// Configuration de multer pour les PDF
const storagePdf = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/pdfs'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const uploadPdf = multer({
  storage: storagePdf,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont autorisés'));
    }
  }
});

// Configuration de multer pour les images
const storageImage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/images'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const uploadImage = multer({
  storage: storageImage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image sont autorisés'));
    }
  }
});

// Contrôleur pour ajouter un PDF
const ajouterFichierPdf = async (req, res) => {

  uploadPdf.single('pdf')(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier PDF fourni' });
    }
    // On suppose que l'id de la consultation est envoyé dans le body
    const { id_consultation } = req.params;
    if (!id_consultation) {
      return res.status(400).json({ success: false, message: "id_consultation manquant" });
    }
    try {
      await query(
        "UPDATE consultation SET detail->>'carnet' = $1 WHERE id_consultation = $2",
        [req.file.filename, id_consultation]
      );
      return res.status(200).json({ success: true, message: 'PDF uploadé et lié à la consultation', file: req.file.filename });
    } catch (e) {
      return res.status(500).json({ success: false, message: "Erreur lors de l'insertion dans la base de données", error: e.message });
    }
  });
};

// Contrôleur pour ajouter une image
const ajouterImage = async (req, res) => {
  uploadImage.single('image')(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucune image fournie' });
    }
    // On suppose que l'id de la consultation est envoyé dans le body
    const { id_consultation } = req.params;
    if (!id_consultation) {
      return res.status(400).json({ success: false, message: "id_consultation manquant" });
    }
    try {
      await query(
        "UPDATE consultation SET image = $1 WHERE id_consultation = $2",
        [req.file.filename, id_consultation]
      );
      return res.status(200).json({ success: true, message: 'Image uploadée et liée à la consultation', file: req.file.filename });
    } catch (e) {
      return res.status(500).json({ success: false, message: "Erreur lors de l'insertion dans la base de données", error: e.message });
    }
  });
};

const dossierDetails = async (req, res) => {
  const { id_dossier } = req.params;
  const { id_hopital } = req.body;
  const { id_utilisateur } = req.body;
  try {
    if (!id_dossier) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant du dossier est requis",
      });
    }

    if (!id_hopital) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à cet hôpital",
      });
    }

    // Requête SQL pour recuperer les données du dossier et du patient
    const dossierDetail = await query(
      `
      SELECT p.*, d.* 
      FROM dossier_medical_global d
      JOIN patient p ON d.id_patient = p.id_patient
      JOIN hopital h ON h.id_hopital = d.id_hopital
      WHERE h.id_hopital = $1 AND d.id_dossier = $2
    `,
      [id_hopital, id_dossier]
    );

    // Gestion des résultats
    if (dossierDetail.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Dossier médical non trouvé",
      });
    }

    const usersArryId = await query(
      `SELECT id_utilisateur FROM utilisateur WHERE id_hopital = $1`,
      [id_hopital]
    );

    if (usersArryId.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun utilisateur trouvé",
      });
    }

    const ArrayId = usersArryId.rows;
    const user = await query(
      `SELECT * FROM utilisateur WHERE id_utilisateur = $1`,
      [id_utilisateur]
    )

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun utilisateur rencontré",
      });
    }

    // const message = `le dossier medicale de ${dossierDetail.rows[0].nom} ${dossierDetail.rows[0].prenom} a ete consulter par ${user.rows[0].nom} ${user.rows[0].prenom}`;
    // const notify = await sendNotification(
    //   ArrayId.map((user) => user.id_utilisateur),
    //   message,
    //   "system"
    // );

    // if (!notify.success) {
    //   return res.status(500).json({
    //     success: false,
    //     message: "Erreur lors de l'envoi des notifications",
    //   });
    // }

    return res.status(200).json({
      success: true,
      message: "Dossier trouvé avec succès",
      data: dossierDetail.rows[0],
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du dossier:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération du dossier",
    });
  }
};

// ======= FONCTION GET CONSULTATION CORRIGÉE =======
const getConsultation = async (req, res) => {
  const { id_dossier } = req.params;
  const { id_utilisateur, password } = req.body; 

  // Validation des champs obligatoires pour le déchiffrement
  if (!id_utilisateur || !password) {
    return res.status(400).json({ 
      success: false,
      error: "ID utilisateur et mot de passe requis pour déchiffrer les données" 
    });
  }

  try {
    // Vérification de l'utilisateur et récupération de ses clés
    const [userCheck, patientCheck] = await Promise.all([
      query('SELECT * FROM utilisateur WHERE id_utilisateur = $1', [id_utilisateur]),
      query('SELECT p.code_access FROM patient p JOIN dossier_medical_global d ON p.id_patient = d.id_patient WHERE d.id_dossier = $1', [id_dossier])
    ]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Utilisateur non trouvé" 
      });
    }

    if (patientCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Dossier médical non trouvé" 
      });
    }

    const user = userCheck.rows[0];

    // Vérification du mot de passe
    const validPassword = await bcrypt.compare(password, user.mot_de_passe_hash);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Mot de passe incorrect' 
      });
    }

    // Déchiffrer le code d'accès stocké avec le mot de passe
    let decryptedCodeAccess;
    try {
      if (!user.code_access_dossier_hash) {
        return res.status(400).json({ 
          success: false, 
          message: 'Code d\'accès non trouvé pour cet utilisateur' 
        });
      }
      decryptedCodeAccess = CryptoJS.AES.decrypt(user.code_access_dossier_hash, password).toString(CryptoJS.enc.Utf8);
      
      if (!decryptedCodeAccess) {
        return res.status(401).json({ 
          success: false, 
          message: 'Code d\'accès invalide' 
        });
      }
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Erreur lors du déchiffrement du code d\'accès',
        error: error.message
      });
    }

    // Récupération des consultations chiffrées
    const consultation = await query(
      `SELECT 
        c.id_consultation,
        c.id_dossier,
        c.id_utilisateur,
        c.date_consultation,
        c.detail,
        u.nom, 
        u.prenom, 
        u.role
      FROM consultation c
      JOIN utilisateur u ON c.id_utilisateur = u.id_utilisateur
      WHERE c.id_dossier = $1 
      ORDER BY c.date_consultation DESC`,
      [id_dossier]
    );

    if (consultation.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucune consultation trouvée"
      });
    }

    // ===== DÉCHIFFREMENT CORRIGÉ =====
    const decryptedConsultations = consultation.rows.map(consult => {
      try {
        // Vérifier si le détail est une chaîne (peut-être déjà un objet JSON stringifié)
        let detailData = consult.detail;
        if (typeof detailData === 'string') {
          try {
            detailData = JSON.parse(detailData);
          } catch (e) {
            console.error("Erreur d'analyse JSON du détail de la consultation:", e);
            throw new Error("Format de données de consultation invalide");
          }
        }

        // Vérifier si les données sont chiffrées
        if (!detailData || !detailData.encrypted_data) {
          // Si pas de données chiffrées, retourner tel quel
          return {
            id_consultation: consult.id_consultation,
            id_dossier: consult.id_dossier,
            id_utilisateur: consult.id_utilisateur,
            date_consultation: consult.date_consultation,
            nom: consult.nom,
            prenom: consult.prenom,
            role: consult.role,
            error: "Données non chiffrées ou format invalide"
          };
        }

        // Déchiffrer avec la même méthode simple utilisée pour le chiffrement
        const encryptedData = detailData.encrypted_data;
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, decryptedCodeAccess);
        const decryptedDetail = JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));

        return {
          id_consultation: consult.id_consultation,
          id_dossier: consult.id_dossier,
          id_utilisateur: consult.id_utilisateur,
          date_consultation: consult.date_consultation,
          nom: consult.nom,
          prenom: consult.prenom,
          role: consult.role,
          // Données déchiffrées directement accessibles
          ...decryptedDetail
        };
      } catch (error) {
        console.error(`Erreur déchiffrement consultation ${consult.id_consultation}:`, error);
        return {
          id_consultation: consult.id_consultation,
          id_dossier: consult.id_dossier,
          id_utilisateur: consult.id_utilisateur,
          date_consultation: consult.date_consultation,
          nom: consult.nom,
          prenom: consult.prenom,
          role: consult.role,
          error: "Erreur de déchiffrement: " + error.message
        };
      }
    });

    // Séparer toutes les consultations et les 2 dernières
    const twoLatestConsultations = decryptedConsultations.slice(0, 2);

    // Ajouter les logs d'accès
    try {
      await addLogs({
        id_dossier: id_dossier,
        id_hopital: user.id_hopital,
        id_utilisateur: id_utilisateur,
        date_acces: new Date(),
        type_action: 'read',
        operation_type: 'consultation',
        dossier_username: user.nom,
        target_type: 'consultation',
        details: { action: 'Consultation des données médicales déchiffrées' }
      });
    } catch (logError) {
      console.error("Erreur lors de l'ajout des logs:", logError);
    }

    return res.status(200).json({
      success: true,
      message: "Consultations récupérées et déchiffrées avec succès",
      data: {
        alldata: decryptedConsultations,
        twodata: twoLatestConsultations
      }
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des consultations:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des consultations",
      error: error.message
    });
  }
};

const deleteDossier = async (req, res) => {

  const { id_dossier } = req.body;

  try {
    const dossier = await query(
      `DELETE FROM dossier_medical_global WHERE id_dossier = $1`,
      [id_dossier]
    );
    return res.status(200).json({
      success: true,
      message: "Dossier supprimé avec succès"
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du dossier:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression du dossier"
    });
  }

}

/**
 * @description delete patient
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const deletePatient = async (req, res) => {
  try {
    const { id_patient } = req.body;

    if (!id_patient) {
      return res.status(400).json({
        success: false,
        message: "ID patient requis"
      });
    }

    // Vérifier si le patient existe
    const patientExists = await query(
      `SELECT id_patient FROM patient WHERE id_patient = $1`,
      [id_patient]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient non trouvé"
      });
    }

    // Récupérer les dossiers médicaux associés au patient
    const dossiers = await query(
      `SELECT id_dossier FROM dossier_medical_global WHERE id_patient = $1`,
      [id_patient]
    );

    // Pour chaque dossier, supprimer les consultations associées
    for (const dossier of dossiers.rows) {
      await query(
        `DELETE FROM consultation WHERE id_dossier = $1`,
        [dossier.id_dossier]
      );
    }

    // Supprimer les dossiers médicaux
    if (dossiers.rows.length > 0) {
      await query(
        `DELETE FROM dossier_medical_global WHERE id_patient = $1`,
        [id_patient]
      );
    }

    // Supprimer le patient
    const result = await query(
      `DELETE FROM patient WHERE id_patient = $1 RETURNING *`,
      [id_patient]
    );

    return res.status(200).json({
      success: true,
      message: "Patient supprimé avec succès",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du patient:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du patient",
      error: error.message
    });
  }
};

const deleteConsultation = async (req, res) => {
  const { id_consultation } = req.params;
  const { id_utilisateur, password } = req.body;

  // Validation des champs obligatoires
  if (!id_utilisateur || !password) {
    return res.status(400).json({ 
      success: false,
      error: "ID utilisateur et mot de passe requis pour la suppression" 
    });
  }

  try {
    // Vérification de l'utilisateur
    const userCheck = await query('SELECT * FROM utilisateur WHERE id_utilisateur = $1', [id_utilisateur]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Utilisateur non trouvé" 
      });
    }

    const user = userCheck.rows[0];

    // Vérification du mot de passe
    const validPassword = await bcrypt.compare(password, user.mot_de_passe_hash);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Mot de passe incorrect' 
      });
    }

    // Vérifier que la consultation existe et récupérer ses informations avant suppression
    const consultationCheck = await query(
      'SELECT c.*, d.id_dossier FROM consultation c JOIN dossier_medical_global d ON c.id_dossier = d.id_dossier WHERE c.id_consultation = $1',
      [id_consultation]
    );

    if (consultationCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Consultation non trouvée"
      });
    }

    const consultation = consultationCheck.rows[0];

    // Déchiffrement de la clé privée pour la blockchain
    let decryptedPrivateKey;
    try {
      const encryptedData = user.cle_prive;
      const [saltHex, ivHex, encryptedKey] = encryptedData.split(':');
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const derivedKey = crypto.scryptSync(password, salt, 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
      decryptedPrivateKey = decipher.update(encryptedKey, 'hex', 'utf8') + decipher.final('utf8');

      if (!/^[0-9a-fA-F]+$/.test(decryptedPrivateKey)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Clé privée invalide après déchiffrement' 
        });
      }
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Erreur lors du déchiffrement de la clé privée' 
      });
    }

    // Suppression de la consultation
    const deleteResult = await query(
      'DELETE FROM consultation WHERE id_consultation = $1 RETURNING *',
      [id_consultation]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la suppression de la consultation'
      });
    }

    const deletedConsultation = deleteResult.rows[0];

    // Préparer les données pour la blockchain
    const blockChainData = {
      type: 'Consultation',
      date: new Date().toISOString(),
      detail: 'Suppression d\'une consultation médicale',
      id_dossier: consultation.id_dossier,
      id_utilisateur: id_utilisateur,
      action: 'suppression_consultation',
      consultation_id: id_consultation,
      deleted_at: new Date().toISOString(),
      deleted_by: {
        id: user.id_utilisateur,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      }
    };

    const transaction = `Suppression d'une consultation médicale - ID: ${id_consultation} - Dossier: ${consultation.id_dossier} - ${new Date().toISOString()} par le Docteur ${user.nom} ${user.prenom}`;

    // Sérialiser le bloc en clair
    const blockDataString = JSON.stringify(blockChainData);

    // Calcul du hash du message à signer
    const messageHash = crypto.createHash('sha256').update(blockDataString).digest();

    // Génération de la signature
    const privateKey = ec.keyFromPrivate(decryptedPrivateKey, 'hex');
    const signature = privateKey.sign(messageHash).toDER('hex');

    // Vérification avec la clé publique
    const publicKey = ec.keyFromPublic(user.cle_publique, 'hex');
    const isVerified = publicKey.verify(messageHash, signature);

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: "Échec de la vérification de la signature sur les données du bloc"
      });
    }

    // Enregistrement dans la blockchain
    const blockchainResult = await addrecordBlockchain(
      blockChainData,
      transaction,
      signature,
      user.cle_publique,
      decryptedPrivateKey
    );

    // Ajouter les logs
    try {
      const resultLog = await addLogs({
        id_dossier: consultation.id_dossier,
        id_hopital: user.id_hopital,
        id_utilisateur: id_utilisateur,
        date_acces: new Date(),
        type_action: 'delete',
        operation_type: 'consultation',
        dossier_username: user.nom,
        target_type: 'consultation',
        details: { 
          action: 'Suppression consultation',
          consultation_id: id_consultation,
          deleted_consultation: deletedConsultation
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Consultation supprimée avec succès',
        data: {
          deleted_consultation: deletedConsultation,
          deleted_at: new Date().toISOString(),
          deleted_by: `${user.prenom} ${user.nom}`
        },
        log: resultLog,
        blockchain: blockchainResult
      });

    } catch (error) {
      console.error("Erreur lors de l'ajout des logs:", error);
      return res.status(500).json({
        success: false,
        message: "Consultation supprimée mais erreur lors de l'enregistrement des logs",
        error: error.message
      });
    }

  } catch (error) {
    console.error("Erreur SQL lors de la suppression:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression de la consultation",
      error: error.message
    });
  }
};

const editPatient = async (req, res) => {
  const {
    nom,
    prenom,
    date_naissance,
    nom_tuteur,
    id_hopital,
    adresse,
    donnees,
    code,
    sexe,
    taille,
    age,
    photo,
    tel,
    email,
    is_paid // Nouveau champ
  } = req.body;
  const { id_patient } = req.params;

  try {
    // Vérifier si le patient existe
    const patientExists = await query(
      `SELECT id_patient FROM patient WHERE id_patient = $1`,
      [id_patient]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient non trouvé"
      });
    }

    // Construire la requête dynamiquement pour ne mettre à jour que les champs fournis
    let updateFields = [];
    let params = [];
    let paramIndex = 1;

    // Ajouter chaque champ à la requête uniquement s'il est défini
    if (nom !== undefined) {
      updateFields.push(`nom = $${paramIndex++}`);
      params.push(nom);
    }
    if (prenom !== undefined) {
      updateFields.push(`prenom = $${paramIndex++}`);
      params.push(prenom);
    }
    if (date_naissance !== undefined) {
      updateFields.push(`date_naissance = $${paramIndex++}`);
      params.push(date_naissance);
    }
    if (nom_tuteur !== undefined) {
      updateFields.push(`nom_tuteur = $${paramIndex++}`);
      params.push(nom_tuteur);
    }
    if (id_hopital !== undefined) {
      updateFields.push(`id_hopital = $${paramIndex++}`);
      params.push(id_hopital);
    }
    if (adresse !== undefined) {
      updateFields.push(`adresse = $${paramIndex++}`);
      params.push(adresse);
    }
    if (donnees !== undefined) {
      updateFields.push(`donnees = $${paramIndex++}`);
      params.push(donnees);
    }
    if (code !== undefined) {
      updateFields.push(`code = $${paramIndex++}`);
      params.push(code);
    }
    if (sexe !== undefined) {
      updateFields.push(`sexe = $${paramIndex++}`);
      params.push(sexe);
    }
    if (taille !== undefined) {
      updateFields.push(`taille = $${paramIndex++}`);
      params.push(taille);
    }
    if (age !== undefined) {
      updateFields.push(`age = $${paramIndex++}`);
      params.push(age);
    }
    if (photo !== undefined) {
      updateFields.push(`photo = $${paramIndex++}`);
      params.push(photo);
    }
    if (tel !== undefined) {
      updateFields.push(`tel = $${paramIndex++}`);
      params.push(tel);
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      params.push(email);
    }
    if (is_paid !== undefined) {
      updateFields.push(`is_paid = $${paramIndex++}`);
      params.push(is_paid);
    }

    // Ajouter l'ID patient comme dernier paramètre
    params.push(id_patient);

    // Exécuter la requête seulement si des champs sont à mettre à jour
    if (updateFields.length > 0) {
      const query_string = `
        UPDATE patient 
        SET ${updateFields.join(', ')} 
        WHERE id_patient = $${paramIndex}
        RETURNING *
      `;

      const result = await query(query_string, params);

      return res.status(200).json({
        success: true,
        message: "Patient modifié avec succès",
        data: result.rows[0]
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Aucune donnée fournie pour la mise à jour"
      });
    }
  } catch (error) {
    console.error("Erreur lors de la modification du patient:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la modification du patient",
      error: error.message
    });
  }
};

/**
 * @description get dossier by id
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getDossierById = async (req, res) => {
  const { id_dossier } = req.params;
  try {
    const dossier = await query(
      `SELECT * FROM dossier_medical_global WHERE id_dossier = $1`,
      [id_dossier]
    );

    if (!dossier.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Dossier non trouvé"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Dossier trouvé avec succès",
      dossier: dossier.rows[0]
    });
  } catch (error) {
    console.error("Erreur lors de la recherche du dossier:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche du dossier",
      error: error.message
    });
  }
};

const getPatientById = async (req, res) => {
  const { id_patient } = req.params;
  try {
    const patient = await query(
      `SELECT * FROM patient WHERE id_patient = $1`,
      [id_patient]
    );

    if (!patient.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Patient non trouvé"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient trouvé avec succès",
      patient: patient.rows[0]
    });
  } catch (error) {
    console.error("Erreur lors de la recherche du patient:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche du patient",
      error: error.message
    });
  }
};

/**
 * @description get consultation for patient
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getconsultationforpatient = async (req, res) => {
  try {
    const { id_patient, code_access } = req.params;
    
    if (!id_patient || !code_access) {
      return res.status(400).json({
        success: false,
        message: "id_patient et code_access sont requis"
      });
    }

    // Récupérer les consultations avec le code d'accès du patient
    const rows = await query(
      `SELECT c.*, u.nom, u.prenom, p.code_access
       FROM consultation c 
       JOIN dossier_medical_global d ON c.id_dossier = d.id_dossier
       JOIN utilisateur u ON c.id_utilisateur = u.id_utilisateur 
       JOIN patient p ON d.id_patient = p.id_patient
       WHERE d.id_patient = $1`,
      [id_patient]
    );

    if (!rows.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Aucune consultation trouvée"
      });
    }

    // Déchiffrer les données de chaque consultation
    const consultationsDecryptees = await Promise.all(rows.rows.map(async (consultation) => {
      try {
        // Extraire les données chiffrées
        const encryptedData = consultation.detail;
        if (!encryptedData || !encryptedData.encrypted) {
          return {
            ...consultation,
            detail: null,
            error: "Format de données invalide"
          };
        }

        // Déchiffrer avec le code d'accès
        const decipher = crypto.createDecipheriv(
          'aes-256-cbc',
          crypto.scryptSync(code_access, 'salt', 32),
          Buffer.from(encryptedData.iv, 'hex')
        );

        let decryptedData = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decryptedData += decipher.final('utf8');

        // Parser les données JSON
        const parsedDetail = JSON.parse(decryptedData);

        return {
          ...consultation,
          detail: parsedDetail
        };
      } catch (error) {
        console.error("Erreur de déchiffrement:", error);
        return {
          ...consultation,
          detail: null,
          error: "Erreur de déchiffrement des données"
        };
      }
    }));

    return res.status(200).json({
      success: true,
      message: "Consultations trouvées",
      consultations: consultationsDecryptees
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};

/**
 * @description Met à jour le statut de paiement d'un patient
 * @param {*} req 
 * @param {*} res 
 * @returns {Object} Réponse HTTP
 */
const updatePatientPaymentStatus = async (req, res) => {
  try {
    const { id_patient } = req.params;
    const { is_paid } = req.body;

    if (is_paid === undefined) {
      return res.status(400).json({
        success: false,
        message: "Le statut de paiement (is_paid) est requis"
      });
    }

    // Vérifier si le patient existe
    const patientExists = await query(
      `SELECT id_patient FROM patient WHERE id_patient = $1`,
      [id_patient]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient non trouvé"
      });
    }

    // Mettre à jour le statut de paiement
    const result = await query(
      `UPDATE patient SET is_paid = $1 WHERE id_patient = $2 RETURNING *`,
      [is_paid, id_patient]
    );

    return res.status(200).json({
      success: true,
      message: `Statut de paiement mis à jour avec succès (${is_paid ? 'Payé' : 'Non payé'})`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de paiement:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut de paiement",
      error: error.message
    });
  }
};

/**
 * @description Récupère tous les patients d'un hôpital
 * @param {*} req 
 * @param {*} res 
 * @returns {Object} Réponse HTTP avec la liste des patients
 */
const getAllPatients = async (req, res) => {
  try {
    const { id_hopital } = req.body;

    if (!id_hopital) {
      return res.status(400).json({
        success: false,
        message: "L'ID de l'hôpital est requis"
      });
    }

    // Récupérer tous les patients de l'hôpital
    const patients = await query(
      `SELECT * FROM patient WHERE id_hopital = $1 ORDER BY nom ASC`,
      [id_hopital]
    );

    return res.status(200).json({
      success: true,
      message: "Patients récupérés avec succès",
      data: patients.rows
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des patients:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des patients",
      error: error.message
    });
  }
};

const ajouterDonneesMedicales = async (req, res) => {
  const {
    id_dossier,
    id_utilisateur,
    password,
    // Données de diagnostic
    diagnostic_principal,
    diagnostic_secondaire,
    symptomes,
    debut_symptomes,
    intensite_douleur,
    etat_general,
    conscience,
    examen_physique,
    antecedents_medicaux,
    allergies,
    medicaments_actuels,
    examens_complementaires,
    // Données de prescription
    medicaments,
    posologie,
    duree_traitement,
    recommandations,
    // Données de traitement
    type_traitement,
    description,
    prochain_rendez_vous,
    orientation_specialiste,
    specialiste
  } = req.body;

  try {
    // Vérifier l'accès au dossier
    const accesResult = await query(
      `SELECT * FROM utilisateur_dosssier_autorise 
       WHERE id_dossier = $1 AND id_utilisateur = $2`,
      [id_dossier, id_utilisateur]
    );

    if (!accesResult.rows.length) {
      return res.status(403).json({
        success: false,
        message: "Vous n'avez pas l'autorisation d'accéder à ce dossier"
      });
    }

    // Récupérer les informations de l'utilisateur
    const userResult = await query(
      `SELECT * FROM utilisateur WHERE id_utilisateur = $1`,
      [id_utilisateur]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    const user = userResult.rows[0];

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.mot_de_passe_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Mot de passe incorrect"
      });
    }

    // Déchiffrer la clé privée
    let decryptedPrivateKey;
    try {
      const encryptedData = user.cle_prive;
      if (!encryptedData) {
        return res.status(400).json({
          success: false,
          message: "Clé privée non trouvée"
        });
      }

      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        return res.status(400).json({
          success: false,
          message: "Format de clé privée invalide"
        });
      }

      const [saltHex, ivHex, encryptedKey] = parts;
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const derivedKey = crypto.scryptSync(password, salt, 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);

      decryptedPrivateKey = decipher.update(encryptedKey, 'hex', 'utf8') +
        decipher.final('utf8');

      if (!/^[0-9a-fA-F]+$/.test(decryptedPrivateKey)) {
        return res.status(400).json({
          success: false,
          message: "Clé privée invalide après déchiffrement"
        });
      }
    } catch (error) {
      console.error('Erreur de déchiffrement:', error);
      return res.status(400).json({
        success: false,
        message: "Erreur lors du déchiffrement de la clé privée"
      });
    }

    // Insérer les données dans chaque table si des données sont présentes
    const results = {};

    // 1. Diagnostic
    if (diagnostic_principal || diagnostic_secondaire || symptomes || examen_physique) {
      const diagnosticData = {
        type: 'DIAGNOSTIC_MEDICAL',
        id_dossier,
        id_utilisateur,
        diagnostic_principal,
        diagnostic_secondaire,
        symptomes,
        debut_symptomes,
        intensite_douleur,
        etat_general,
        conscience,
        examen_physique,
        antecedents_medicaux,
        allergies,
        medicaments_actuels,
        examens_complementaires,
        timestamp: new Date().toISOString()
      };

      const dataStr = JSON.stringify(diagnosticData);
      const dataHash = SHA256(dataStr).toString();
      const key = ec.keyFromPrivate(decryptedPrivateKey);
      const signature = key.sign(dataHash).toDER('hex');

      const blockchainResult = await addrecordBlockchain(
        diagnosticData,
        signature,
        user.cle_publique,
        process.env.BLOCKCHAIN_SECRET_KEY
      );

      if (!blockchainResult.success) {
        return res.status(500).json({
          success: false,
          message: "Erreur lors de l'enregistrement dans la blockchain",
          error: blockchainResult.error
        });
      }

      const diagnosticResult = await query(
        `INSERT INTO diagnostic_medical (
          id_dossier, id_utilisateur, diagnostic_principal, diagnostic_secondaire,
          symptomes, debut_symptomes, intensite_douleur, etat_general,
          conscience, examen_physique, antecedents_medicaux, allergies,
          medicaments_actuels, examens_complementaires, signature, hash_blockchain
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id_diagnostic`,
        [
          id_dossier, id_utilisateur, diagnostic_principal, diagnostic_secondaire,
          JSON.stringify(symptomes), debut_symptomes, intensite_douleur, etat_general,
          conscience, examen_physique, JSON.stringify(antecedents_medicaux),
          JSON.stringify(allergies), JSON.stringify(medicaments_actuels),
          JSON.stringify(examens_complementaires), signature, blockchainResult.hash
        ]
      );

      results.diagnostic = diagnosticResult.rows[0];
    }

    // 2. Prescription
    if (medicaments && medicaments.length > 0) {
      const prescriptionData = {
        type: 'PRESCRIPTION_MEDICALE',
        id_dossier,
        id_utilisateur,
        medicaments,
        posologie,
        duree_traitement,
        recommandations,
        timestamp: new Date().toISOString()
      };

      const dataStr = JSON.stringify(prescriptionData);
      const dataHash = SHA256(dataStr).toString();
      const key = ec.keyFromPrivate(decryptedPrivateKey);
      const signature = key.sign(dataHash).toDER('hex');

      const blockchainResult = await addrecordBlockchain(
        prescriptionData,
        signature,
        user.cle_publique,
        process.env.BLOCKCHAIN_SECRET_KEY
      );

      if (!blockchainResult.success) {
        return res.status(500).json({
          success: false,
          message: "Erreur lors de l'enregistrement dans la blockchain",
          error: blockchainResult.error
        });
      }

      const prescriptionResult = await query(
        `INSERT INTO prescription_medicale (
          id_dossier, id_utilisateur, medicaments, posologie,
          duree_traitement, recommandations, signature, hash_blockchain
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id_prescription`,
        [
          id_dossier, id_utilisateur, JSON.stringify(medicaments),
          posologie, duree_traitement, recommandations,
          signature, blockchainResult.hash
        ]
      );

      results.prescription = prescriptionResult.rows[0];
    }

    // 3. Traitement
    if (type_traitement || description) {
      const traitementData = {
        type: 'TRAITEMENT_MEDICAL',
        id_dossier,
        id_utilisateur,
        type_traitement,
        description,
        prochain_rendez_vous,
        orientation_specialiste,
        specialiste,
        timestamp: new Date().toISOString()
      };

      const dataStr = JSON.stringify(traitementData);
      const dataHash = SHA256(dataStr).toString();
      const key = ec.keyFromPrivate(decryptedPrivateKey);
      const signature = key.sign(dataHash).toDER('hex');

      const blockchainResult = await addrecordBlockchain(
        traitementData,
        signature,
        user.cle_publique,
        process.env.BLOCKCHAIN_SECRET_KEY
      );

      if (!blockchainResult.success) {
        return res.status(500).json({
          success: false,
          message: "Erreur lors de l'enregistrement dans la blockchain",
          error: blockchainResult.error
        });
      }

      const traitementResult = await query(
        `INSERT INTO traitement_medical (
          id_dossier, id_utilisateur, type_traitement, description,
          prochain_rendez_vous, orientation_specialiste, specialiste,
          signature, hash_blockchain
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id_traitement`,
        [
          id_dossier, id_utilisateur, type_traitement, description,
          prochain_rendez_vous, orientation_specialiste, specialiste,
          signature, blockchainResult.hash
        ]
      );

      results.traitement = traitementResult.rows[0];
    }

    // Enregistrer dans l'historique
    await query(
      `INSERT INTO historique_acces_dossier (
        id_dossier, id_utilisateur, type_action, operation_type,
        details, signature, id_hopital
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id_dossier,
        id_utilisateur,
        'AJOUT_DONNEES_MEDICALES',
        'INSERT',
        JSON.stringify(results),
        signature,
        user.id_hopital
      ]
    );

    // Envoyer une notification
    const dossierResult = await query(
      `SELECT p.nom, p.prenom FROM dossier_medical_global d
       JOIN patient p ON d.id_patient = p.id_patient
       WHERE d.id_dossier = $1`,
      [id_dossier]
    );

    if (dossierResult.rows.length > 0) {
      const patient = dossierResult.rows[0];
      const message = `${user.nom} ${user.prenom} a ajouté des données médicales au dossier de ${patient.prenom} ${patient.nom}`;

      await query(
        `INSERT INTO notification (id_utilisateur, message, type)
         SELECT id_utilisateur, $1, 'system'
         FROM utilisateur
         WHERE id_hopital = $2 AND id_utilisateur != $3`,
        [message, user.id_hopital, id_utilisateur]
      );

      // Envoyer la notification via Socket.IO
      if (socketIO && socketIO.io) {
        socketIO.io.to(`hopital_${user.id_hopital}`).emit('notification', {
          message,
          type: 'system',
          timestamp: new Date()
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Données médicales ajoutées avec succès",
      data: results
    });

  } catch (error) {
    console.error("Erreur lors de l'ajout des données médicales:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout des données médicales",
      error: error.message
    });
  }
};

module.exports = {
  dossierDetails,
  getConsultation,
  getconsultationforpatient,
  ajouterFichierPdf,
  ajouterImage,
  deleteDossier,
  deletePatient,
  deleteConsultation,
  editPatient,
  getPatientById,
  addPatient,
  setActivePersonnel,
  setInactivePersonnel,
  editPersonnel,
  addPersonnel,
  getPersonnelById,
  loginpatient,
  getconsultationforpatient,
  updatePatientPaymentStatus,
  getAllPatients,
  ajouterDonneesMedicales,
  getDossierById,
};

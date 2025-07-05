const xlsx = require('xlsx');
const { query } = require('../config/db');
const socketIO = require('../socket');
const path = require("path");
const bcrypt = require("bcrypt");
const { createGenesisBlock, addrecordBlockchain } = require("../blockchaine/medicalBlockchain");
const { SHA256 } = require("crypto-js");
const CryptoJS = require("crypto-js");
const { ec: EC } = require("elliptic");
const ec = new EC("secp256k1");
const crypto = require("crypto");
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { sendNotification } = require('./medXchange/notification');


const impoterProffessionnelToExcel = async (req, res) => {
  const { id_hopital } = req.body;

  if (!id_hopital) {
    return res.status(400).json({
      success: false,
      message: "L'ID de l'hôpital est requis"
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Aucun fichier sélectionné"
    });
  }

  const filepath = req.file.path;

  try {
    // Lecture du fichier Excel
    const workbook = xlsx.readFile(filepath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    if (!jsonData || jsonData.length === 0) {
      fs.unlinkSync(filepath);

      return res.status(400).json({
        success: false,
        message: 'Le fichier est vide ou mal formaté'
      });
    }

    const personnelfields = ["nom", "prenom", "email", "mot_de_passe_hash", "role", "adresse"];
    const personnelData = [];

    for (const row of jsonData) {
      // Validation des champs obligatoires
      if (!row.nom || !row.prenom || !row.email || !row.mot_de_passe_hash || !row.role) {
        throw new Error(`Tous les champs obligatoires doivent être remplis pour ${row.nom || ''} ${row.prenom || ''}`);
      }


      const password_hash = bcrypt.hashSync(row.mot_de_passe_hash, 10);
      const date_creation = new Date();

      // Construction de l'objet autre_donnees avec tous les champs non-standard
      const autre_donnees = {};
      for (const [key, value] of Object.entries(row)) {
        if (!personnelfields.includes(key.toLowerCase()) && key !== 'id_hopital') {
          autre_donnees[key] = value !== undefined ? value : null;
        }
      }

      const personnel = {
        nom: row.nom,
        prenom: row.prenom,
        email: row.email,
        mot_de_passe_hash: password_hash,
        role: row.role,
        id_hopital: id_hopital,
        autre_donnees: JSON.stringify(autre_donnees), // Conversion en JSON
        adresse: row.adresse || null,
        created_at: date_creation,
        updated_at: date_creation
      };

      personnelData.push(personnel);
    }

    // Insertion des données
    const insertedIds = [];
    for (const personnel of personnelData) {
      try {
        const sql = `
                  INSERT INTO utilisateur(
                      nom, prenom, email,
                      mot_de_passe_hash, role, id_hopital, autre_donnees,
                      adresse, created_at, updated_at
                  )
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                  RETURNING id_utilisateur
              `;

        const result = await query(sql, [
          personnel.nom,
          personnel.prenom,
          personnel.email,
          personnel.mot_de_passe_hash,
          personnel.role,
          personnel.id_hopital,
          personnel.autre_donnees,
          personnel.adresse,
          personnel.created_at,
          personnel.updated_at
        ]);

        if (!result.rows[0]) {
          throw new Error(`Échec de l'insertion pour ${personnel.nom} ${personnel.prenom}`);
        }

        const token = jwt.sign(
          {
            id_utilisateur: result.rows[0].id_utilisateur,
            email: personnel.email,
            role: personnel.role
          },
          process.env.TOKEN_KEY,
          { expiresIn: '30d' }
        );

        await query(
          `UPDATE utilisateur SET token = $1 
                  WHERE id_utilisateur = $2`,
          [token, result.rows[0].id_utilisateur]
        );

        insertedIds.push(result.rows[0].id_utilisateur);
      } catch (error) {
        console.error(`Erreur lors de l'insertion de ${personnel.nom} ${personnel.prenom}:`, error);
        // Continue avec les autres enregistrements même en cas d'erreur
      }
    }

    if (insertedIds.length === 0) {
      throw new Error("Aucun enregistrement n'a pu être inséré");
    }

    fs.unlinkSync(filepath);

    res.status(200).json({
      success: true,
      message: 'Importation terminée avec succès',
      stats: {
        total: jsonData.length,
        inserted: insertedIds.length,
        failed: jsonData.length - insertedIds.length
      },
      insertedIds
    });

  } catch (error) {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    console.error('Erreur lors de l\'importation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'importation',
      error: error.message,
    });
  }
};

const getAllProfessionnels = async (req, res) => {
  try {
    const { id_hopital } = req.body;
    let queryText = "SELECT * FROM utilisateur";
    const params = [];

    if (id_hopital) {
      queryText += " WHERE id_hopital = $1";
      params.push(id_hopital);
    }

    const result = await query(queryText, params);

    return res.status(200).json({
      success: true,
      message: "Liste des professionnels récupérée avec succès",
      data: result.rows
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des professionnels:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des professionnels",
      error: error.message
    });
  }
};

/**
 * Créer un nouveau professionnel de santé
 */
const createProfessionnel = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      role,
      specialite,
      sexe,
      id_hopital,
      access_record
    } = req.body;

    // Validation des champs obligatoires
    if (!nom || !prenom || !email || !role || !specialite || !sexe || !id_hopital) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Générer un mot de passe par défaut (combinaison de nom, prénom et rôle)
    const defaultPassword = `aaaaaaaa`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Insérer le professionnel avec le statut d'accès global aux dossiers
    const result = await query(`
      INSERT INTO utilisateur 
      (nom, prenom, email, mot_de_passe_hash, role, id_hopital, specialite, sexe,access_record) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `, [nom, prenom, email, hashedPassword, role, id_hopital, specialite, sexe, access_record || false]);

    if (result.rows.length === 0) {
      throw new Error("Erreur lors de la création du professionnel de santé");
    }

    res.status(201).json({
      success: true,
      message: 'Professionnel de santé créé avec succès',
      professionnel: {
        ...result.rows[0],
        mot_de_passe_defaut: defaultPassword
      }
    });
  } catch (error) {
    console.error("Erreur lors de la création du professionnel:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
 
/**
 * Ajouter une autorisation d'accès à un dossier spécifique pour un professionnel
 */
const ajouterAutorisationDossier = async (req, res) => {
  try {
    const { id_utilisateur, code_access, password } = req.body;

    if (!id_utilisateur || !code_access || !password) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants'
      });
    }

    // Vérifier le code d'accès et récupérer le dossier
    const patient = await query(`SELECT * FROM patient WHERE code_access IS NOT NULL`, []);
    if (!patient.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Aucun patient trouvé avec un code d\'accès'
      });
    }

    // Vérifier le hash du code d'accès pour chaque patient
    let patientFound = null;
    for (const p of patient.rows) {
      const isValidCode = await bcrypt.compare(code_access, p.code_access);
      if (isValidCode) {
        patientFound = p;
        break;
      }
    }

    if (!patientFound) {
      return res.status(404).json({
        success: false,
        message: 'Code d\'accès invalide'
      });
    }

    // Vérifier si le dossier médical existe pour ce patient
    const dossierCheck = await query(`
      SELECT id_dossier FROM dossier_medical_global 
      WHERE id_patient = $1
    `, [patientFound.id_patient]);

    if (!dossierCheck.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Dossier médical non trouvé pour ce patient'
      });
    }

    const id_dossier = dossierCheck.rows[0].id_dossier;

    // Vérifier si l'accès existe déjà
    const existCheck = await query(`
      SELECT * FROM utilisateur_dosssier_autorise 
      WHERE id_utilisateur = $1 AND id_dossier = $2 
    `, [id_utilisateur, id_dossier]);

    if (existCheck.rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Vous avez déjà accès à ce dossier',
        donnees: patientFound
      });
    }

    // Récupérer les infos utilisateur
    const userInfo = await query(`SELECT * FROM utilisateur WHERE id_utilisateur = $1`, [id_utilisateur]);
    if (!userInfo.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = userInfo.rows[0];

    // Vérifier le mot de passe de l'utilisateur
    const validPassword = await bcrypt.compare(password, user.mot_de_passe_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    // Chiffrer le code d'accès avec le mot de passe
    const encryptedCodeAccess = CryptoJS.AES.encrypt(code_access, password).toString();

    // Stocker le code d'accès chiffré dans la table utilisateur
    await query(`
      UPDATE utilisateur 
      SET code_access_dossier_hash = $1
      WHERE id_utilisateur = $2
    `, [encryptedCodeAccess, id_utilisateur]);

    // Préparer les données pour la blockchain
    const autorisationData = {
      type: 'ACCES_DOSSIER',
      id_utilisateur,
      id_dossier,
      timestamp: new Date().toISOString(),
      metadata: {
        nom_utilisateur: user.nom + ' ' + user.prenom,
        role_utilisateur: user.role,
        code_access: code_access
      }
    };

    // Ajouter l'autorisation
    const result = await query(`
      INSERT INTO utilisateur_dosssier_autorise 
      (id_utilisateur, id_dossier, date_autorisation) 
      VALUES ($1, $2, CURRENT_DATE) 
      RETURNING *
    `, [id_utilisateur, id_dossier]);

    // Enregistrer l'historique
    await query(`
      INSERT INTO historique_acces_dossier 
      (id_dossier, id_utilisateur, date_acces, type_action, operation_type, 
       details, id_hopital)
      VALUES ($1, $2, CURRENT_TIMESTAMP, 'ACCES_CODE', 'GRANT',
              $3, $4)
    `, [
      id_dossier,
      id_utilisateur,
      JSON.stringify(autorisationData),
      user.id_hopital
    ]);

    // Notification
    await query(`
      INSERT INTO notification 
      (id_utilisateur, message, type, create_time)
      VALUES ($1, $2, 'acces_dossier', CURRENT_DATE)
    `, [
      id_utilisateur,
      `Accès au dossier #${id_dossier} accordé`
    ]);

    // Socket notification
    if (socketIO.getIO()) {
      socketIO.getIO().to(`user_${id_utilisateur}`).emit('notification', {
        type: 'acces_dossier',
        message: `Accès au dossier #${id_dossier} accordé`,
        data: {
          ...result.rows[0]
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Accès accordé',
      donnees: patientFound,
      autorisation: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur accès dossier:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Supprimer une autorisation d'accès
 */
const supprimerAutorisationDossier = async (req, res) => {
  try {
    const { id_autorisation, id_admin, password } = req.body;

    if (!id_autorisation || !id_admin || !password) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'autorisation, ID admin et mot de passe requis'
      });
    }

    // Récupérer les informations de l'autorisation et de l'admin
    const [autorisationInfo, adminInfo] = await Promise.all([
      query(`
        SELECT uda.*, u.id_hopital 
        FROM utilisateur_dosssier_autorise uda
        JOIN utilisateur u ON uda.id_utilisateur = u.id_utilisateur
        WHERE uda.id = $1
      `, [id_autorisation]),
      query('SELECT * FROM utilisateur WHERE id_utilisateur = $1', [id_admin])
    ]);

    if (!autorisationInfo.rows[0] || !adminInfo.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Autorisation ou admin non trouvé'
      });
    }

    // Vérifier le mot de passe de l'admin
    const validPassword = await bcrypt.compare(password, adminInfo.rows[0].mot_de_passe_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    // Déchiffrer la clé privée de l'admin
    let decryptedPrivateKey;
    try {
      const encryptedData = adminInfo.rows[0].cle_prive;
      if (!encryptedData) {
        return res.status(400).json({
          success: false,
          message: 'Clé privée non trouvée pour l\'administrateur'
        });
      }

      // Vérifier le format de la clé chiffrée
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        return res.status(400).json({
          success: false,
          message: 'Format de clé privée invalide'
        });
      }

      const [saltHex, ivHex, encryptedKey] = parts;
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const derivedKey = crypto.scryptSync(password, salt, 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
      
      decryptedPrivateKey = decipher.update(encryptedKey, 'hex', 'utf8') + 
                           decipher.final('utf8');

      // Vérifier que la clé déchiffrée est un hexadécimal valide
      if (!/^[0-9a-fA-F]+$/.test(decryptedPrivateKey)) {
        return res.status(400).json({
          success: false,
          message: 'Clé privée invalide après déchiffrement'
        });
      }
    } catch (error) {
      console.error('Erreur de déchiffrement:', error);
      return res.status(400).json({
        success: false,
        message: 'Erreur lors du déchiffrement de la clé privée'
      });
    }

    // Créer l'objet de suppression pour la blockchain
    const suppressionData = {
      type: 'SUPPRESSION_AUTORISATION',
      id_autorisation,
      id_utilisateur: autorisationInfo.rows[0].id_utilisateur,
      id_dossier: autorisationInfo.rows[0].id_dossier,
      id_admin,
      timestamp: new Date().toISOString(),
      metadata: {
        nom_admin: adminInfo.rows[0].nom + ' ' + adminInfo.rows[0].prenom,
        role_admin: adminInfo.rows[0].role
      }
    };

    // Signer les données avec la clé privée déchiffrée
    const dataStr = JSON.stringify(suppressionData);
    const dataHash = SHA256(dataStr).toString();
    const key = ec.keyFromPrivate(decryptedPrivateKey);
    const signature = key.sign(dataHash).toDER('hex');

    // Enregistrer dans la blockchain
    const blockchainResult = await addrecordBlockchain(
      suppressionData,
      signature,
      adminInfo.rows[0].cle_publique,
      process.env.BLOCKCHAIN_SECRET_KEY
    );

    if (blockchainResult.error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'enregistrement dans la blockchain',
        error: blockchainResult.error
      });
    }

    // Supprimer l'autorisation
    const result = await query(`
      DELETE FROM utilisateur_dosssier_autorise 
      WHERE id = $1 
      RETURNING *
    `, [id_autorisation]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Autorisation non trouvée'
      });
    }

    // Enregistrer dans l'historique
    await query(`
      INSERT INTO historique_acces_dossier 
      (id_dossier, id_utilisateur, date_acces, type_action, operation_type, 
       details, signature, id_hopital, public_key, block_hash)
      VALUES ($1, $2, CURRENT_TIMESTAMP, 'SUPPRESSION_AUTORISATION', 'REVOKE',
              $3, $4, $5, $6, $7)
    `, [
      autorisationInfo.rows[0].id_dossier,
      autorisationInfo.rows[0].id_utilisateur,
      JSON.stringify(suppressionData),
      signature,
      autorisationInfo.rows[0].id_hopital,
      adminInfo.rows[0].cle_publique,
      blockchainResult.blockHash || null
    ]);

    // Créer une notification
    await query(`
      INSERT INTO notification 
      (id_utilisateur, message, type, create_time)
      VALUES ($1, $2, 'suppression_autorisation', CURRENT_DATE)
    `, [
      autorisationInfo.rows[0].id_utilisateur,
      `Votre accès au dossier médical #${autorisationInfo.rows[0].id_dossier} a été révoqué`
    ]);

    // Notification en temps réel
    if (socketIO.getIO()) {
      socketIO.getIO().to(`user_${autorisationInfo.rows[0].id_utilisateur}`).emit('notification', {
        type: 'suppression_autorisation',
        message: `Votre accès au dossier médical #${autorisationInfo.rows[0].id_dossier} a été révoqué`,
        data: result.rows[0]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Autorisation supprimée avec succès',
      blockchain: blockchainResult
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'autorisation:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Récupérer les dossiers auxquels un professionnel a accès
 */
const getDossiersAutorises = async (req, res) => {
  try {
    const { id_utilisateur } = req.params;

    if (!id_utilisateur) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur manquant'
      });
    }

    // Vérifier si l'utilisateur a un accès global
    const userCheck = await query(`
      SELECT access_record FROM utilisateur 
      WHERE id_utilisateur = $1
    `, [id_utilisateur]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Professionnel non trouvé'
      });
    }

    // Si l'utilisateur a un accès global, renvoyer tous les dossiers
    if (userCheck.rows[0].access_record) {
      const allDossiers = await query(`
        SELECT dmg.*, p.nom as nom_patient, p.prenom as prenom_patient
        FROM dossier_medical_global dmg
        JOIN patient p ON dmg.id_patient = p.id_patient
      `);

      return res.status(200).json({
        success: true,
        acces_global: true,
        dossiers: allDossiers.rows
      });
    }

    // Sinon, renvoyer seulement les dossiers autorisés
    const dossiers = await query(`
      SELECT dmg.*, p.nom as nom_patient, p.prenom as prenom_patient, uda.date_autorisation
      FROM utilisateur_dosssier_autorise uda
      JOIN dossier_medical_global dmg ON uda.id_dossier = dmg.id_dossier
      JOIN patient p ON dmg.id_patient = p.id_patient
      WHERE uda.id_utilisateur = $1
    `, [id_utilisateur]);

    res.status(200).json({
      success: true,
      acces_global: false,
      dossiers: dossiers.rows
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des dossiers autorisés:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Demander l'accès à un dossier médical
 */
const demanderAccesDossier = async (req, res) => {
  try {
    const { id_utilisateur, id_dossier, motif } = req.body;

    if (!id_utilisateur || !id_dossier || !motif) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants'
      });
    }

    // Récupérer les informations de l'utilisateur
    const userInfo = await query('SELECT * FROM utilisateur WHERE id_utilisateur = $1', [id_utilisateur]);
    if (!userInfo.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'utilisateur a déjà une demande en attente
    const existingRequest = await query(`
      SELECT * FROM demande_acces_dossier 
      WHERE id_utilisateur = $1 AND id_dossier = $2 AND statut = 'EN_ATTENTE'
    `, [id_utilisateur, id_dossier]);

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Une demande d\'accès en attente existe déjà pour ce dossier'
      });
    }

    // Insérer la demande
    const result = await query(`
      INSERT INTO demande_acces_dossier 
      (id_utilisateur, id_dossier, motif, statut) 
      VALUES ($1, $2, $3, 'EN_ATTENTE') 
      RETURNING *
    `, [id_utilisateur, id_dossier, motif]);

    // Récupérer les administrateurs
    const admins = await query(`
      SELECT id_utilisateur FROM utilisateur 
      WHERE role = 'admin'
    `);

    // Préparer les données de la notification
    const notificationData = {
      ...result.rows[0],
      demandeur: {
        nom: userInfo.rows[0].nom,
        prenom: userInfo.rows[0].prenom,
        role: userInfo.rows[0].role
      }
    };

    // Envoyer les notifications aux administrateurs
    const adminIds = admins.rows.map(admin => admin.id_utilisateur);
    await sendNotification(
      `Nouvelle demande d'accès au dossier #${id_dossier}`,
      adminIds,
      'demande_acces',
      notificationData
    );

    res.status(201).json({
      success: true,
      message: 'Demande d\'accès envoyée avec succès',
      demande: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur lors de la demande d'accès:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Mettre à jour un professionnel de santé
 */
const updateProfessionnel = async (req, res) => {
  try {
    const { id_utilisateur } = req.params;
    const {
      nom,
      prenom,
      email,
      role,
      specialite,
      sexe,
      access_record,
      reset_password
    } = req.body;

    // Vérifier si le professionnel existe
    const userCheck = await query(`
      SELECT * FROM utilisateur 
      WHERE id_utilisateur = $1
    `, [id_utilisateur]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Professionnel non trouvé'
      });
    }

    // Préparer les champs à mettre à jour
    let updateFields = [];
    let params = [];
    let paramCount = 1;

    if (nom) {
      updateFields.push(`nom = $${paramCount++}`);
      params.push(nom);
    }

    if (prenom) {
      updateFields.push(`prenom = $${paramCount++}`);
      params.push(prenom);
    }

    if (email) {
      updateFields.push(`email = $${paramCount++}`);
      params.push(email);
    }

    if (role) {
      updateFields.push(`role = $${paramCount++}`);
      params.push(role);
    }

    if (specialite) {
      updateFields.push(`specialite = $${paramCount++}`);
      params.push(specialite);
    }

    if (sexe) {
      updateFields.push(`sexe = $${paramCount++}`);
      params.push(sexe);
    }

    if (access_record !== undefined) {
      updateFields.push(`access_record = $${paramCount++}`);
      params.push(access_record);
    }

    // Si on demande une réinitialisation du mot de passe
    let newPassword = null;
    if (reset_password) {
      const defaultPassword = `${userCheck.rows[0].prenom.toLowerCase()}${userCheck.rows[0].nom.toLowerCase()}123`;
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      updateFields.push(`mot_de_passe_hash = $${paramCount++}`);
      params.push(hashedPassword);
      newPassword = defaultPassword;
    }

    // Si aucun champ à mettre à jour, renvoyer un message
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun champ à mettre à jour'
      });
    }

    // Ajouter l'id_utilisateur comme dernier paramètre
    params.push(id_utilisateur);

    // Exécuter la mise à jour
    const result = await query(`
      UPDATE utilisateur 
      SET ${updateFields.join(', ')} 
      WHERE id_utilisateur = $${paramCount} 
      RETURNING *
    `, params);

    // Préparer la réponse
    const response = {
      success: true,
      message: 'Professionnel mis à jour avec succès',
      professionnel: result.rows[0]
    };

    // Ajouter le nouveau mot de passe si réinitialisé
    if (newPassword) {
      response.mot_de_passe_defaut = newPassword;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du professionnel:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Récupérer les demandes d'accès aux dossiers
 */
const getDemandesAcces = async (req, res) => {
  try {
   
    const result = await query(`
      SELECT * FROM demande_acces_dossier  ORDER BY date_demande DESC
    `);

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Aucune demande d\'accès trouvée'
      });
    }

   
    res.status(200).json({
      success: true,
      message: 'Demandes d\'accès trouvées',
      demandes: result.rows
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes d'accès:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Traiter une demande d'accès (accepter ou refuser)
 */
const traiterDemandeAcces = async (req, res) => {
  try {
    const { id_demande, id_admin, statut, commentaire, password } = req.body;

    if (!id_demande || !id_admin || !statut || !password) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants'
      });
    }

    // Récupérer les informations de la demande et de l'admin
    const [demandeInfo, adminInfo] = await Promise.all([
      query(`
        SELECT dad.*, u.id_hopital 
        FROM demande_acces_dossier dad
        JOIN utilisateur u ON dad.id_utilisateur = u.id_utilisateur
        WHERE dad.id = $1
      `, [id_demande]),
      query('SELECT * FROM utilisateur WHERE id_utilisateur = $1', [id_admin])
    ]);

    if (!demandeInfo.rows[0] || !adminInfo.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Demande ou admin non trouvé'
      });
    }

    // Vérifier le mot de passe de l'admin
    const validPassword = await bcrypt.compare(password, adminInfo.rows[0].mot_de_passe_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

   // Dans ProfessionnelControllers.js
   const decryptedPrivateKey = require('crypto-js/aes').decrypt(
       adminInfo.rows[0].cle_prive,
       password
   );
   
   // Vérifier si le déchiffrement a réussi
   if (!decryptedPrivateKey) {
       return res.status(400).json({
           success: false,
           message: 'Échec du déchiffrement de'
       })
      }

    // Créer l'objet de traitement pour la blockchain
    const traitementData = {
      type: 'TRAITEMENT_DEMANDE_ACCES',
      id_demande,
      id_utilisateur: demandeInfo.rows[0].id_utilisateur,
      id_dossier: demandeInfo.rows[0].id_dossier,
      id_admin,
      statut,
      commentaire,
      timestamp: new Date().toISOString()
    };

    // Signer les données avec la clé privée déchiffrée
    const dataStr = JSON.stringify(traitementData);
    const dataHash = require('crypto-js/sha256')(dataStr).toString();
    const key = ec.keyFromPrivate(decryptedPrivateKey);
    const signature = key.sign(dataHash).toDER('hex');

    // Enregistrer dans la blockchain
    const blockchainResult = await addrecordBlockchain(
      traitementData,
      signature,
      adminInfo.rows[0].cle_publique,
      process.env.BLOCKCHAIN_SECRET_KEY
    );

    if (blockchainResult.error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'enregistrement dans la blockchain',
        error: blockchainResult.error
      });
    }

    // Mettre à jour le statut de la demande
    const updateResult = await query(`
      UPDATE demande_acces_dossier 
      SET statut = $1, 
          id_admin_traitant = $2, 
          date_traitement = CURRENT_TIMESTAMP, 
          commentaire = $3 
      WHERE id = $4 
      RETURNING *
    `, [statut, id_admin, commentaire || null, id_demande]);

    // Si la demande est acceptée, ajouter l'autorisation
    if (statut === 'accepter') {
      await query(`
        INSERT INTO utilisateur_dosssier_autorise 
        (id_utilisateur, id_dossier, autorisation_donnee_par, date_autorisation) 
        VALUES ($1, $2, $3, CURRENT_DATE)
      `, [demandeInfo.rows[0].id_utilisateur, demandeInfo.rows[0].id_dossier, id_admin]);
    }

    // Enregistrer dans l'historique
    await query(`
      INSERT INTO historique_acces_dossier 
      (id_dossier, id_utilisateur, date_acces, type_action, operation_type, 
       details, signature, id_hopital, public_key, block_hash)
      VALUES ($1, $2, CURRENT_TIMESTAMP, 'TRAITEMENT_DEMANDE', $3,
              $4, $5, $6, $7, $8)
    `, [
      demandeInfo.rows[0].id_dossier,
      demandeInfo.rows[0].id_utilisateur,
      statut === 'accepter' ? 'GRANT' : 'DENY',
      JSON.stringify(traitementData),
      signature,
      demandeInfo.rows[0].id_hopital,
      adminInfo.rows[0].public_key,
      blockchainResult.blockHash
    ]);

    // Créer une notification pour le demandeur
    await query(`
      INSERT INTO notification 
      (id_utilisateur, message, type, create_time)
      VALUES ($1, $2, 'traitement_demande', CURRENT_DATE)
    `, [
      demandeInfo.rows[0].id_utilisateur,
      `Votre demande d'accès au dossier #${demandeInfo.rows[0].id_dossier} a été ${statut === 'accepter' ? 'acceptée' : 'refusée'}`
    ]);

    // Notification en temps réel
    if (socketIO.getIO()) {
      socketIO.getIO().to(`user_${demandeInfo.rows[0].id_utilisateur}`).emit('notification', {
        type: 'traitement_demande',
        message: `Votre demande d'accès au dossier #${demandeInfo.rows[0].id_dossier} a été ${statut === 'accepter' ? 'acceptée' : 'refusée'}`,
        data: updateResult.rows[0]
      });
    }

    res.status(200).json({
      success: true,
      message: `Demande ${statut === 'accepter' ? 'acceptée' : 'refusée'} avec succès`,
      demande: updateResult.rows[0],
      blockchain: blockchainResult
    });
  } catch (error) {
    console.error("Erreur lors du traitement de la demande d'accès:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Set a personnel as active
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const setActivePersonnel = async (req, res) => {
  try {
    const { id_utilisateur } = req.params;

    if (!id_utilisateur) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur requis"
      });
    }

    // Update user status to active
    const result = await query('UPDATE utilisateur SET statut = $1 WHERE id_utilisateur = $2 RETURNING *', ['Actif', id_utilisateur]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Utilisateur activé avec succès",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur lors de l'activation de l'utilisateur:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'activation de l'utilisateur"
    });
  }
};

/**
 * Set a personnel as inactive
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const setInactivePersonnel = async (req, res) => {
  try {
    const { id_utilisateur } = req.params;

    if (!id_utilisateur) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur requis"
      });
    }

    // Update user status to inactive
    const result = await query('UPDATE utilisateur SET statut = $1 WHERE id_utilisateur = $2 RETURNING *', ['Inactif', id_utilisateur]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Utilisateur désactivé avec succès",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur lors de la désactivation de l'utilisateur:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la désactivation de l'utilisateur"
    });
  }
};

/**
 * Récupérer les dossiers disponibles pour la demande d'accès
 */
const getDossiersDisponiblesPourDemande = async (req, res) => {
  try {
    const { id_utilisateur } = req.params;

    if (!id_utilisateur) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur requis'
      });
    }

    // Vérifier si l'utilisateur a un accès global
    const userCheck = await query(`
      SELECT access_record, id_hopital FROM utilisateur 
      WHERE id_utilisateur = $1
    `, [id_utilisateur]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Si l'utilisateur a un accès global, renvoyer un message approprié
    if (userCheck.rows[0].access_record) {
      return res.status(200).json({
        success: true,
        message: 'Vous avez déjà un accès global à tous les dossiers',
        dossiers: []
      });
    }

    // Récupérer les dossiers auxquels l'utilisateur n'a pas accès
    const dossiers = await query(`
      SELECT DISTINCT dmg.*, p.nom as nom_patient, p.prenom as prenom_patient
      FROM dossier_medical_global dmg
      JOIN patient p ON dmg.id_patient = p.id_patient
      WHERE dmg.id_hopital = $1
      AND NOT EXISTS (
        SELECT 1 FROM utilisateur_dosssier_autorise uda 
        WHERE uda.id_dossier = dmg.id_dossier 
        AND uda.id_utilisateur = $2
      )
      AND NOT EXISTS (
        SELECT 1 FROM demande_acces_dossier dad 
        WHERE dad.id_dossier = dmg.id_dossier 
        AND dad.id_utilisateur = $2 
        AND dad.statut = 'EN_ATTENTE'
      )
    `, [userCheck.rows[0].id_hopital, id_utilisateur]);

    res.status(200).json({
      success: true,
      message: dossiers.rows.length > 0 ? 'Dossiers disponibles trouvés' : 'Aucun dossier disponible pour demande d\'accès',
      dossiers: dossiers.rows
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des dossiers disponibles:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  impoterProffessionnelToExcel,
  getAllProfessionnels,
  createProfessionnel,
  ajouterAutorisationDossier,
  supprimerAutorisationDossier,
  getDossiersAutorises,
  demanderAccesDossier,
  updateProfessionnel,
  getDemandesAcces,
  traiterDemandeAcces,
  setActivePersonnel,
  setInactivePersonnel,
  getDossiersDisponiblesPourDemande
};
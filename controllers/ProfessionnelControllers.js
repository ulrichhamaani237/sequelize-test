const { ProfessionnelSante } = require('../models');
const xlsx = require('xlsx');
const upload = require('../uploads/uploadProfess');
const { query } = require('../config/db');
const bcrypt = require('bcrypt');

const importProffessionnelToExcel = async (req, res) => {

  try {
    // Vérifier si le fichier a été récupéré
    if (!req.file) {
      console.log('Aucun fichier sélectionné');
      return res.status(400).json({ message: "Aucun fichier sélectionné" });
    }

    const filePath = req.file.path; // Chemin du fichier uploadé
    console.log('Chemin du fichier:', filePath);

    // Récupération des données dans le fichier Excel
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Récupérer le nom de la première feuille
    const sheet = workbook.Sheets[sheetName]; // Récupérer la feuille

    // Convertir la feuille en JSON
    const jsonData = xlsx.utils.sheet_to_json(sheet);
    console.log('Données JSON:', jsonData);

    // Enregistrer les données dans la base de données
    for (const row of jsonData) {
      await ProfessionnelSante.create(row);
    }

    console.log('Fichier importé avec succès');
    res.status(200).json({ message: 'Fichier importé avec succès', data: jsonData });
  } catch (error) {
    console.error('Erreur lors de l\'importation du fichier:', error);
    res.status(500).json({ message: error.message });
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
      acces_global_dossiers
    } = req.body;

    // Validation des champs obligatoires
    if (!nom || !prenom || !email || !role || !specialite || !sexe || !id_hopital) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Générer un mot de passe par défaut (combinaison de nom, prénom et rôle)
    const defaultPassword = `${prenom.toLowerCase()}${nom.toLowerCase()}123`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Insérer le professionnel avec le statut d'accès global aux dossiers
    const result = await query(`
      INSERT INTO utilisateur 
      (nom, prenom, email, mot_de_passe_hash, role, id_hopital, specialite, sexe, acces_global_dossiers) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `, [nom, prenom, email, hashedPassword, role, id_hopital, specialite, sexe, acces_global_dossiers || false]);

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
    const { id_utilisateur, id_dossier, id_admin } = req.body;

    // Vérification des paramètres
    if (!id_utilisateur || !id_dossier || !id_admin) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants'
      });
    }

    // Vérifier si l'autorisation existe déjà
    const existCheck = await query(`
      SELECT * FROM utilisateur_dosssier_autorise 
      WHERE id_utilisateur = $1 AND id_dossier = $2
    `, [id_utilisateur, id_dossier]);

    if (existCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cette autorisation existe déjà'
      });
    }

    // Ajouter l'autorisation
    const result = await query(`
      INSERT INTO utilisateur_dosssier_autorise 
      (id_utilisateur, id_dossier, autorisation_donnee_par) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `, [id_utilisateur, id_dossier, id_admin]);

    res.status(201).json({
      success: true,
      message: 'Autorisation ajoutée avec succès',
      autorisation: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'autorisation:", error);
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
    const { id_autorisation } = req.params;

    if (!id_autorisation) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'autorisation manquant'
      });
    }

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

    res.status(200).json({
      success: true,
      message: 'Autorisation supprimée avec succès'
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
      SELECT acces_global_dossiers FROM utilisateur 
      WHERE id_utilisateur = $1
    `, [id_utilisateur]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Si l'utilisateur a un accès global, renvoyer tous les dossiers
    if (userCheck.rows[0].acces_global_dossiers) {
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

    // Insérer la demande dans une nouvelle table demande_acces_dossier
    const result = await query(`
      INSERT INTO demande_acces_dossier 
      (id_utilisateur, id_dossier, motif, statut) 
      VALUES ($1, $2, $3, 'EN_ATTENTE') 
      RETURNING *
    `, [id_utilisateur, id_dossier, motif]);

    // Récupérer les administrateurs du système pour notification
    const admins = await query(`
      SELECT id_utilisateur FROM utilisateur 
      WHERE role = 'admin'
    `);

    // Créer des notifications pour chaque admin
    if (admins.rows.length > 0) {
      const userData = await query(`
        SELECT nom, prenom FROM utilisateur 
        WHERE id_utilisateur = $1
      `, [id_utilisateur]);

      const patientData = await query(`
        SELECT p.nom, p.prenom FROM patient p
        JOIN dossier_medical_global dmg ON p.id_patient = dmg.id_patient
        WHERE dmg.id_dossier = $1
      `, [id_dossier]);

      const nomComplet = userData.rows.length > 0 
        ? `${userData.rows[0].prenom} ${userData.rows[0].nom}` 
        : 'Un professionnel';
      
      const nomPatient = patientData.rows.length > 0 
        ? `${patientData.rows[0].prenom} ${patientData.rows[0].nom}` 
        : 'un patient';

      for (const admin of admins.rows) {
        await query(`
          INSERT INTO notification 
          (id_utilisateur, message, type) 
          VALUES ($1, $2, 'demande_acces')
        `, [admin.id_utilisateur, `${nomComplet} demande l'accès au dossier de ${nomPatient}`]);
      }
    }

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
      acces_global_dossiers,
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
    
    if (acces_global_dossiers !== undefined) {
      updateFields.push(`acces_global_dossiers = $${paramCount++}`);
      params.push(acces_global_dossiers);
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
    const { statut } = req.query;
    
    let query_string = `
      SELECT * FROM demande_acces_dossier 
    `;
    
    const params = [];
    
    if (statut && statut !== 'TOUS') {
      query_string += `WHERE statut = $1 `;
      params.push(statut);
    }
    
    query_string += `ORDER BY date_demande DESC`;
    
    const result = await query(query_string, params);
    
    res.status(200).json({
      success: true,
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
    const { id_demande, id_admin, statut, commentaire } = req.body;
    
    if (!id_demande || !id_admin || !statut) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants'
      });
    }
    
    // Vérifier si la demande existe
    const demande = await query(`
      SELECT * FROM demande_acces_dossier WHERE id = $1
    `, [id_demande]);
    
    if (demande.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
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
    if (statut === 'ACCEPTE') {
      await query(`
        INSERT INTO utilisateur_dosssier_autorise 
        (id_utilisateur, id_dossier, autorisation_donnee_par) 
        VALUES ($1, $2, $3)
        ON CONFLICT (id_utilisateur, id_dossier) DO NOTHING
      `, [demande.rows[0].id_utilisateur, demande.rows[0].id_dossier, id_admin]);
    }
    
    // Créer une notification pour le professionnel
    const professionnelInfo = await query(`
      SELECT nom, prenom FROM utilisateur WHERE id_utilisateur = $1
    `, [demande.rows[0].id_utilisateur]);
    
    const patientInfo = await query(`
      SELECT p.nom, p.prenom 
      FROM patient p 
      JOIN dossier_medical_global dmg ON p.id_patient = dmg.id_patient 
      WHERE dmg.id_dossier = $1
    `, [demande.rows[0].id_dossier]);
    
    const nomPatient = patientInfo.rows.length > 0 
      ? `${patientInfo.rows[0].prenom} ${patientInfo.rows[0].nom}`
      : "un patient";
    
    await query(`
      INSERT INTO notification 
      (id_utilisateur, message, type) 
      VALUES ($1, $2, 'demande_acces')
    `, [
      demande.rows[0].id_utilisateur, 
      `Votre demande d'accès au dossier de ${nomPatient} a été ${statut === 'ACCEPTE' ? 'acceptée' : 'refusée'}.${commentaire ? ' Commentaire: ' + commentaire : ''}`
    ]);
    
    res.status(200).json({
      success: true,
      message: `Demande ${statut === 'ACCEPTE' ? 'acceptée' : 'refusée'} avec succès`,
      demande: updateResult.rows[0]
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

module.exports = {
  importProffessionnelToExcel,
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
  setInactivePersonnel
};
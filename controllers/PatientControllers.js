const { query } = require('../config/db');

/**
 * Fonction pour créer un nouveau patient
 */
const createPatient = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      telephone,
      adresse,
      date_naissance,
      sexe,
      id_hopital,
      statut
    } = req.body;

    // Vérification des données requises
    if (!nom || !prenom || !id_hopital) {
      return res.status(400).json({
        success: false,
        message: 'Les champs nom, prénom et id_hopital sont obligatoires'
      });
    }

    // Création du patient dans la base de données
    const result = await query(`
      INSERT INTO patient 
      (nom, prenom, email, telephone, adresse, date_naissance, sexe, id_hopital, statut) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `, [nom, prenom, email, telephone, adresse, date_naissance, sexe, id_hopital, statut || 'Actif']);

    res.status(201).json({
      success: true,
      message: 'Patient créé avec succès',
      patient: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur lors de la création du patient:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Fonction pour récupérer tous les patients
 */
const getAllPatient = async (req, res) => {
  try {
    const { id_hopital } = req.query;
    
    let queryText = 'SELECT * FROM patient';
    const params = [];
    
    if (id_hopital) {
      queryText += ' WHERE id_hopital = $1';
      params.push(id_hopital);
    }
    
    queryText += ' ORDER BY id_patient DESC';
    
    const result = await query(queryText, params);

    res.status(200).json({
      success: true,
      patients: result.rows
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des patients:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Fonction pour récupérer un patient par son ID
 */
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('SELECT * FROM patient WHERE id_patient = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }
    
    res.status(200).json({
      success: true,
      patient: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du patient:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Fonction pour modifier un patient
 */
const EditPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nom,
      prenom,
      email,
      telephone,
      adresse,
      date_naissance,
      sexe,
      statut
    } = req.body;

    // Vérifier si le patient existe
    const patientCheck = await query('SELECT * FROM patient WHERE id_patient = $1', [id]);
    
    if (patientCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
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
    
    if (telephone) {
      updateFields.push(`telephone = $${paramCount++}`);
      params.push(telephone);
    }
    
    if (adresse) {
      updateFields.push(`adresse = $${paramCount++}`);
      params.push(adresse);
    }
    
    if (date_naissance) {
      updateFields.push(`date_naissance = $${paramCount++}`);
      params.push(date_naissance);
    }
    
    if (sexe) {
      updateFields.push(`sexe = $${paramCount++}`);
      params.push(sexe);
    }
    
    if (statut) {
      updateFields.push(`statut = $${paramCount++}`);
      params.push(statut);
    }

    // Si aucun champ à mettre à jour
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun champ à mettre à jour'
      });
    }

    // Ajouter l'ID comme dernier paramètre
    params.push(id);

    // Exécuter la mise à jour
    const result = await query(`
      UPDATE patient 
      SET ${updateFields.join(', ')} 
      WHERE id_patient = $${paramCount} 
      RETURNING *
    `, params);

    res.status(200).json({
      success: true,
      message: 'Patient mis à jour avec succès',
      patient: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du patient:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Fonction pour supprimer un patient
 */
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si le patient existe
    const patientCheck = await query('SELECT * FROM patient WHERE id_patient = $1', [id]);
    
    if (patientCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }
    
    // Supprimer le patient
    await query('DELETE FROM patient WHERE id_patient = $1', [id]);
    
    res.status(200).json({
      success: true,
      message: 'Patient supprimé avec succès'
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du patient:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Fonction pour importer des patients depuis un fichier Excel
 */
const importPatientsFromExcel = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier n\'a été uploadé'
      });
    }

    // Ici, vous devriez implémenter la logique pour lire le fichier Excel
    // et insérer les données dans la base de données
    // Cela nécessiterait l'utilisation d'une bibliothèque comme 'xlsx'
    
    res.status(200).json({
      success: true,
      message: 'Cette fonction n\'est pas encore complètement implémentée'
    });
  } catch (error) {
    console.error("Erreur lors de l'importation des patients:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createPatient,
  getAllPatient,
  getPatientById,
  EditPatient,
  deletePatient,
  importPatientsFromExcel
}; 
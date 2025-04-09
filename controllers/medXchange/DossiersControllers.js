require('dotenv').config();
const { query } = require("../../config/db");

const dossierDetails = async (req, res) => {
  const { id_dossier } = req.params;
  const { id_hopital } = req.body; // Préférable: récupérer depuis le token

  try {
    // Validation
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

    // Requête SQL
    const dossierDetail = await query(`
      SELECT p.*, d.donnees_medicales 
      FROM dossier_medical_global d
      JOIN patient p ON d.id_patient = p.id_patient
      JOIN hopital h ON h.id_hopital = d.id_hopital
      WHERE h.id_hopital = $1 AND d.id_dossier = $2
    `, [id_hopital, id_dossier]);

    // Gestion des résultats
    if (dossierDetail.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Dossier médical non trouvé",
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Dossier trouvé avec succès',
      data: dossierDetail.rows[0] // Retourne un seul objet si l'ID est unique
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du dossier:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du dossier',
    });
  }
};

module.exports = {
  dossierDetails
};
require("dotenv").config();
const { query } = require("../../config/db");

const addLogs = async (data) => {
  try {
    const { id_dossier, id_hopital, id_utilisateur, date_acces, type_action, operation_type, dossier_username, target_type, details } = data;

    if (!id_dossier || !id_utilisateur || !date_acces || !type_action || !operation_type || !dossier_username || !target_type || !details || !id_hopital) {
      throw new Error("Tous les champs sont requis");
    }
    
    const result = await query(
     `INSERT INTO historique_acces_dossier(
      id_dossier,
      id_utilisateur,
      date_acces,
      type_action,
      operation_type,
      dossier_username,
      target_type,
      details,
      id_hopital
      ) VALUES($1, $2, $3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id_dossier, id_utilisateur, date_acces, type_action, operation_type, dossier_username, target_type, details,id_hopital]
    );

    if (result.rows.length === 0) {
      throw new Error("Échec de l'insertion des logs");
    }

    const code_user = await query(
      `SELECT code FROM utilisateur WHERE id_utilisateur = $1`,
      [id_utilisateur]
    );
    // notification a envoyé
    const Notification = {
      user_code: code_user.rows[0].code,
      operation_type: result.rows[0].operation_type,
      action_type: result.rows[0].type_action,
      timestamp: result.rows[0].date_acces,
      target_id: result.rows[0].id_dossier,
      target_type: result.rows[0].target_type,
      file_code: result.rows[0].id_dossier,
      details: result.rows[0].details,
    }

    global.socket.emit(`notification_hopital_${id_hopital}`, Notification);

    return {
      success: true,
      message: "cette operation sera visible par l admin",
      data: result.rows[0]
    };
  } catch (error) {
    console.error("Erreur SQL:", error);
    throw error;
  }
}

const getLogs = async (req, res) => {
  const { id_hopital } = req.body;
  try {
    const logs = await query(
      `SELECT ROW_NUMBER() OVER (ORDER BY date_acces DESC) as id, * 
       FROM historique_acces_dossier 
       WHERE id_hopital = $1 
       ORDER BY date_acces DESC`,
      [id_hopital]
    );
    return res.status(200).json(
      {
        success: true,
        message: "Logs récupérés avec succès",
        data: logs.rows
      }
    );
  } catch (error) {
    console.error("Erreur SQL:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
}

module.exports = {addLogs, getLogs};
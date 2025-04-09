const { query } = require("../../config/db");

const envoyerNotificationUtilisateur = async (userId, message) => {
  try {
    await query(
      `SELECT pg_notify(
        'user_notification', 
        $1
      )`,
      [
        JSON.stringify({
          userId: userId,
          data: {
            type: "message",
            content: message,
            timestamp: new Date().toISOString(),
          },
        }),
      ]
    );
  } catch (err) {
    console.log(err);
  }
};

const envoyerNotificationMultiUtilisateurs = async (userIds, message) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new Error("Un tableau valide d'IDs utilisateur est requis");
  }

  try {
    await query(
      `SELECT pg_notify(
          'multi_user_notification', 
          $1
        )`,
      [
        JSON.stringify({
          userIds: userIds,
          data: {
            type: "message",
            content: message,
            timestamp: new Date().toISOString(),
          },
        }),
      ]
    );
  } catch (err) {
    console.log(err);
  }
};


const notifications = async (req, res) => {
  try {
    const userId = req.params.id_utilisateur;
    
    // Validation de l'ID utilisateur
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur manquant",
      });
    }
    
    const notification = await query(
      "SELECT * FROM notification WHERE id_utilisateur = $1 ORDER BY create_time DESC",
      [userId]
    );
    
    // Formater les données pour qu'elles correspondent au format attendu par le frontend
    const formattedNotifications = notification.rows.map(notif => ({
      id: notif.id_utilisateur, // Assurez-vous que votre table a une colonne 'id'
      message: notif.message,
      time: formatTimeAgo(notif.create_time), // Fonction à créer pour formater le temps
      read: notif.read === true, // Assurez-vous que votre table a une colonne 'read'
      type: notif.type || 'system' // Utiliser un type par défaut si non spécifié
    }));
    
    return res.status(200).json({
      success: true,
      data: formattedNotifications,
      message:
        notification.rows.length > 0
          ? "Notifications récupérées avec succès"
          : "Aucune notification trouvée",
    });
  } catch (error) {
    console.error("Erreur dans notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des notifications",
    });
  }
};

const sendNotifications = async (req, res) => {
  try {
    const { message, id_utilisateur, type = 'system' } = req.body;
    
    // Validation des entrées
    if (!message || !id_utilisateur) {
      return res.status(400).json({
        success: false,
        message: "Message et ID utilisateur sont obligatoires"
      });
    }
    
    // Vérification que l'ID utilisateur est un nombre valide
    if (isNaN(id_utilisateur) || id_utilisateur <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide"
      });
    }
    
    // Insertion de la notification
    const response = await query(
      `INSERT INTO notification(id_utilisateur, message, create_time, type, read)
        VALUES($1, $2, $3, $4, $5)
        RETURNING *`,
      [id_utilisateur, message, new Date(), type, false]
    );
    
    // Vérification du résultat de l'insertion
    if (response.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Échec de l'insertion de la notification"
      });
    }
    
    const newNotification = response.rows[0];
    
    // Formater la notification pour l'émission en temps réel
    const formattedNotification = {
      id: newNotification.id_utilisateur, // ID de la notification, pas de l'utilisateur
      message: newNotification.message,
      time: 'À l\'instant',
      read: false,
      type: newNotification.type || 'system'
    };
    
    // Accéder à io depuis global
    global.io.emit(`notification_${id_utilisateur}`, formattedNotification);
    
    return res.status(201).json({
      success: true,
      message: "Notification créée avec succès",
      data: formattedNotification
    });
    
  } catch (error) {
    console.error("Erreur dans sendNotifications:", error);
    
    // Gestion spécifique des erreurs de contrainte
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: "L'utilisateur spécifié n'existe pas"
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création de la notification"
    });
  }
};

// Fonction utilitaire pour formater le temps écoulé
function formatTimeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000); // différence en secondes
  
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} minutes`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} heures`;
  if (diff < 172800) return 'Hier';
  
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
}


module.exports = {
  envoyerNotificationUtilisateur,
  envoyerNotificationMultiUtilisateurs,
  notifications,
  sendNotifications,
};

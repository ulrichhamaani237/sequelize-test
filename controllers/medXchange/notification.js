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
      "SELECT * FROM notification WHERE id_utilisateur = $1 ORDER BY create_time DESC LIMIT 20",
      [userId]
    );

    // Formater les données pour qu'elles correspondent au format attendu par le frontend
    const formattedNotifications = notification.rows.map((notif) => ({
      id: notif.id_utilisateur, // Assurez-vous que votre table a une colonne 'id'
      message: notif.message,
      time: formatTimeAgo(notif.create_time), // Fonction à créer pour formater le temps
      read: notif.read === true, // Assurez-vous que votre table a une colonne 'read'
      type: notif.type || "system", // Utiliser un type par défaut si non spécifié
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
    const { message, id_utilisateur, type = "system" } = req.body;

    // Validation des entrées
    if (!message || !id_utilisateur) {
      return res.status(400).json({
        success: false,
        message: "Message et ID utilisateur sont obligatoires",
      });
    }

    // Vérification que l'ID utilisateur est un nombre valide
    if (isNaN(id_utilisateur) || id_utilisateur <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
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
        message: "Échec de l'insertion de la notification",
      });
    }

    const newNotification = response.rows[0];

    // Formater la notification pour l'émission en temps réel
    const formattedNotification = {
      id: newNotification.id_utilisateur, // ID de la notification, pas de l'utilisateur
      message: newNotification.message,
      time: "À l'instant",
      read: false,
      type: newNotification.type || "system",
    };

    // Accéder à io depuis global
    global.socket.emit(`notification_${id_utilisateur}`, formattedNotification);

    return res.status(201).json({
      success: true,
      message: "Notification créée avec succès",
      data: formattedNotification,
      notification: newNotification,
    });
  } catch (error) {
    console.error("Erreur dans sendNotifications:", error);

    // Gestion spécifique des erreurs de contrainte
    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "L'utilisateur spécifié n'existe pas",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création de la notification",
    });
  }
};

// Fonction utilitaire pour formater le temps écoulé
function formatTimeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000); // différence en secondes

  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} minutes`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} heures`;
  if (diff < 172800) return "Hier";

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// const sendBulkNotifications = async (req, res) => {
//   try {
//     const { message, user_ids, type = 'system' } = req.body;

//     // Validation des entrées
//     if (!message || !user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Message et tableau d'IDs utilisateur sont obligatoires"
//       });
//     }

//     // Vérification que tous les IDs sont valides
//     const invalidIds = user_ids.filter(id => isNaN(id) || id <= 0);
//     if (invalidIds.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: `IDs utilisateur invalides: ${invalidIds.join(', ')}`
//       });
//     }

//     // Préparation des valeurs pour l'insertion multiple
//     const values = user_ids.map(id => [id, message, new Date(), type, false]);
//     const placeholders = values.map((_, i) =>
//       `($${i*5 + 1}, $${i*5 + 2}, $${i*5 + 3}, $${i*5 + 4}, $${i*5 + 5})`
//     ).join(',');

//     // Insertion des notifications en une seule requête
//     const response = await query(
//       `INSERT INTO notification(id_utilisateur, message, create_time, type, read)
//        VALUES ${placeholders}
//        RETURNING *`,
//       values.flat()
//     );

//     // Vérification du résultat de l'insertion
//     if (response.rows.length !== user_ids.length) {
//       return res.status(500).json({
//         success: false,
//         message: "Certaines notifications n'ont pas pu être créées"
//       });
//     }

//     // Formater les notifications pour l'émission en temps réel
//     const formattedNotifications = response.rows.map(notif => ({
//       id: notif.id,
//       message: notif.message,
//       time: 'À l\'instant',
//       read: false,
//       type: notif.type || 'system'
//     }));

//     // Émettre les notifications à chaque utilisateur concerné
//     response.rows.forEach(notif => {
//       const formattedNotif = {
//         id: notif.id,
//         message: notif.message,
//         time: 'À l\'instant',
//         read: false,
//         type: notif.type || 'system'
//       };
//       global.socket.emit(`notification_${notif.id_utilisateur}`, formattedNotif);
//     });

//     return res.status(201).json({
//       success: true,
//       message: `${response.rows.length} notifications créées avec succès`,
//       data: formattedNotifications
//     });

//   } catch (error) {
//     console.error("Erreur dans sendBulkNotifications:", error);

//     // Gestion spécifique des erreurs de contrainte
//     if (error.code === '23503') {
//       const match = error.message.match(/Key \(id_utilisateur\)=\((\d+)\)/);
//       const invalidUserId = match ? match[1] : 'inconnu';
//       return res.status(400).json({
//         success: false,
//         message: `L'utilisateur avec ID ${invalidUserId} n'existe pas`
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Erreur serveur lors de la création des notifications"
//     });
//   }
// };

/**
 * @description Envoie des notifications à plusieurs utilisateurs
 * @param {string} message - Le message de notification
 * @param {number[]} userIds - Tableau d'IDs utilisateur
 * @param {string} [type='system'] - Type de notification
 * @returns {Promise<{success: boolean, data?: any[], message?: string}>}
 */
async function sendBulkNotifications(message, userIds, type = "system") {
  try {
    // Validation des entrées
    if (
      !message ||
      !userIds ||
      !Array.isArray(userIds) ||
      userIds.length === 0
    ) {
      return {
        success: false,
        message: "Message et tableau d'IDs utilisateur sont obligatoires",
      };
    }

    // Filtrage des IDs valides (uniques et numériques)
    const validUserIds = [...new Set(userIds)].filter(
      (id) => !isNaN(id) && id > 0
    );

    if (validUserIds.length === 0) {
      return {
        success: false,
        message: "Aucun ID utilisateur valide fourni",
      };
    }

    // Préparation de la requête batch
    const values = validUserIds.map((id) => [
      id,
      message,
      new Date(),
      type,
      false,
    ]);
    const placeholders = values
      .map(
        (_, i) =>
          `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${
            i * 5 + 5
          })`
      )
      .join(",");

    // Insertion des notifications
    const response = await query(
      `INSERT INTO notification(id_utilisateur, message, create_time, type, read)
       VALUES ${placeholders}
       RETURNING *`,
      values.flat()
    );


    // Émission des notifications en temps réel
    response.rows.forEach((notif) => {
      global.socket.emit(`notification_${notif.id_utilisateur}`, {
        id: notif.id,
        message: notif.message,
        time: "À l'instant",
        read: false,
        type: notif.type || "system",
      });
    });

    return {
      success: true,
      data: response.rows,
      message: `${response.rows.length} notifications envoyées`,
    };

  } catch (error) {
    console.error("Erreur dans sendBulkNotifications:", error);

    // Gestion spécifique des erreurs PostgreSQL
    if (error.code === "23503") {
      const match = error.message.match(/Key \(id_utilisateur\)=\((\d+)\)/);
      return {
        success: false,
        message: `L'utilisateur avec ID ${
          match ? match[1] : "inconnu"
        } n'existe pas`,
      };
    }

    return {
      success: false,
      message: "Erreur serveur lors de l'envoi des notifications",
    };
  }
}

const sendNotificationsToAllUsers = async (req, res) => {
  const { id_hopital, id_dossier } = req.body;

  try {
  } catch (error) {}
};

module.exports = {
  envoyerNotificationUtilisateur,
  envoyerNotificationMultiUtilisateurs,
  notifications,
  sendNotifications,
  sendBulkNotifications,
};

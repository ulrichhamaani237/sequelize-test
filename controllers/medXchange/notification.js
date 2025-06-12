const { query } = require("../../config/db");
const socketIO = require('../../socket');

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
      "SELECT * FROM notification WHERE id_utilisateur = $1 ORDER BY create_time DESC LIMIT 8",
      [userId]
    );

    // Formater les données pour qu'elles correspondent au format attendu par le frontend
    const formattedNotifications = notification.rows.map((notif) => ({
      id: notif.id,
      message: notif.message,
      time: formatTimeAgo(notif.create_time),
      read: notif.read === true,
      type: notif.type || "system",
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
      id: newNotification.id_utilisateur,
      message: newNotification.message,
      time: "À l'instant",
      read: false,
      type: newNotification.type || "system",
    };

    // Émettre la notification via socket.io
    const io = socketIO.getIO();
    if (io) {
      io.to(`user_${id_utilisateur}`).emit('notification', formattedNotification);
    }

    return res.status(201).json({
      success: true,
      message: "Notification créée avec succès",
      data: formattedNotification,
      notification: newNotification,
    });
  } catch (error) {
    console.error("Erreur dans sendNotifications:", error);

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

/**
 * @description Envoie une notification à un ou plusieurs utilisateurs
 * @param {string} message - Le message de notification
 * @param {number|number[]} userIds - ID utilisateur unique ou tableau d'IDs utilisateur
 * @param {string} [type='system'] - Type de notification
 * @param {Object} [data] - Données supplémentaires à inclure dans la notification
 * @returns {Promise<{success: boolean, data?: any[], message?: string}>}
 */
async function sendNotification(message, userIds, type = "system", data = null) {
  try {
    // Convertir en tableau si un seul ID est fourni
    const userIdArray = Array.isArray(userIds) ? userIds : [userIds];

    // Validation des entrées
    if (!message || !userIdArray || userIdArray.length === 0) {
      return {
        success: false,
        message: "Message et ID(s) utilisateur sont obligatoires",
      };
    }

    // Filtrage des IDs valides (uniques et numériques)
    const validUserIds = [...new Set(userIdArray)].filter(
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
    const io = socketIO.getIO();
    if (io) {
      response.rows.forEach((notif) => {
        const notificationData = {
          id: notif.id,
          message: notif.message,
          time: "À l'instant",
          read: false,
          type: notif.type || "system",
        };

        // Ajouter les données supplémentaires si présentes
        if (data) {
          notificationData.data = data;
        }

        // Envoyer à la salle spécifique de l'utilisateur
        io.to(`user_${notif.id_utilisateur}`).emit('notification', notificationData);

        // Si c'est une notification admin, envoyer aussi à la salle admin
        if (type === 'admin' || type === 'demande_acces') {
          io.to('admin_room').emit('admin_notification', notificationData);
        }
      });
    }

    return {
      success: true,
      data: response.rows,
      message: `${response.rows.length} notification(s) envoyée(s)`,
    };

  } catch (error) {
    console.error("Erreur dans sendNotification:", error);

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
  sendNotification,
};

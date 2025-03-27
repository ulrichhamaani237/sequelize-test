const { envoyerNotificationMultiUtilisateurs } = require('./notification');
const { query } = require('../../config/db');

async function simulateNotifications() {
  // 1. Méthode via le contrôleur Node.js
  console.log("Envoi via le contrôleur Node.js...");
  await envoyerNotificationMultiUtilisateurs(
    [101, 102, 103], // Tableau d'IDs
    "Ceci est une simulation depuis Node.js"
  );

  // 2. Méthode directe via SQL
  console.log("Envoi via requête SQL directe...");
  await query(`
    SELECT pg_notify(
      'multi_user_notification', 
      $1
    )`, 
    [JSON.stringify({
      userIds: [201, 202, 203],
      data: {
        type: "test_direct",
        content: "Notification simulée via SQL direct",
        timestamp: new Date().toISOString()
      }
    })]
  );

  console.log("Simulation terminée !");
}

// Exécuter la simulation
simulateNotifications()
  .catch(console.error);
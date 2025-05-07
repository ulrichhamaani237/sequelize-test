require('dotenv').config();
const { Pool } = require('pg');

// const pool = new Pool({
//   host: process.env.PGHOST,
//   user: process.env.PGUSER,
//   password: process.env.PGPASSWORD,
//   database: process.env.PGDATABASE,
//   port: process.env.PGPORT,
//   ssl: true 
// });


const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT
});


const setupUserNotificationClient = async () => {
  const client = await pool.connect();
  
  client.on('notification', (msg) => {
    console.log('Notification utilisateur:', msg);
    try {
      const { userId, data } = JSON.parse(msg.payload);
      if (global.io && userId) {
        global.io.to(`user:${userId}`).emit(`pg:notification`, data);
      }
    } catch (err) {
      console.error('Erreur de parsing JSON:', err);
    }
  });

  await client.query('LISTEN user_notification');
  return client;
};


const setupMultiUserNotificationClient = async () => {
  const client = await pool.connect();
  
  client.on('notification', (msg) => {
    console.log('Notification multi-utilisateurs:', msg);
    try {
      const { userIds, data } = JSON.parse(msg.payload);
      if (global.io && userIds && Array.isArray(userIds)) {
        userIds.forEach(userId => {
          global.io.to(`user:${userId}`).emit(`pg:notification`, data);
        });
      }
    } catch (err) {
      console.error('Erreur de parsing JSON:', err);
    }
  });

  await client.query('LISTEN multi_user_notification');
  return client;
};

// Nouvelle fonction pour les notifications
const setupNotificationClient = async () => {
  const client = await pool.connect();
  
  client.on('notification', (msg) => {
    console.log('Notification PG:', msg);
    if (global.io) { // global.io sera défini dans server.js
      global.io.emit(`pg:${msg.channel}`, JSON.parse(msg.payload));
    }
  });

  await client.query('LISTEN nouvelle_consultation');
  return client;
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  setupNotificationClient,
  setupUserNotificationClient,
  setupMultiUserNotificationClient
};
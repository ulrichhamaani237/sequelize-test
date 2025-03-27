const { query } = require('../../config/db');

const envoyerNotificationUtilisateur = async (userId, message) => {
  try {
    await query(
      `SELECT pg_notify(
        'user_notification', 
        $1
      )`,
      [JSON.stringify({
        userId: userId,
        data: {
          type: 'message',
          content: message,
          timestamp: new Date().toISOString()
        }
      })]
    );
  } catch(err){
    console.log(err);
    
  }
};

const envoyerNotificationMultiUtilisateurs = async (userIds, message) => {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('Un tableau valide d\'IDs utilisateur est requis');
    }
  
    try {
      await query(
        `SELECT pg_notify(
          'multi_user_notification', 
          $1
        )`,
        [JSON.stringify({
          userIds: userIds,
          data: {
            type: 'message',
            content: message,
            timestamp: new Date().toISOString()
          }
        })]
      );
    } catch(err){
        console.log(err);
    }
  };
  
 
module.exports = {
  envoyerNotificationUtilisateur,
  envoyerNotificationMultiUtilisateurs,
  
};
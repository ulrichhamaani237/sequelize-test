const jwt = require('jsonwebtoken');
require('dotenv').config();
const { query } = require('../config/db');


const protectionRoute = (req, res, next) => {
    try {

        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);
        console.log('decoded:', decoded);

        const sql = 'SELECT id, nom, role FROM utilisateur WHERE id = $1 AND token = $2';
        const {rows} = query(sql, [decoded.id_utilisateur, token]);
        if (!rows.length) {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        console.log('rows:', rows);
        req.user = rows[0];
        next();
    
        
    } catch (error) {
        console.error('Erreur de parsing JSON:', err);
        res.status(401).json({ 
            message: error.name === 'JsonWebTokenError' 
              ? "Token invalide" 
              : "Erreur d'authentification" 
          });
    }
};

module.exports = protectionRoute;
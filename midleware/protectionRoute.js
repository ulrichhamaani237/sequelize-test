const jwt = require('jsonwebtoken');
require('dotenv').config();
const { query } = require('../config/db');


const protectionRoute = async (req, res, next) => { 
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(403).json({ error: 'Accès refusé 1' });
        }

        const decoded = jwt.verify(token, process.env.TOKEN_KEY);

        // Ajoutez await ici
        const { rows } = await query(
            'SELECT id_utilisateur, nom, role FROM utilisateur WHERE id_utilisateur = $1 AND token = $2',
            [decoded.id_utilisateur, token]
        );

        if (!rows.length) {
            return res.status(403).json({ error: 'Accès  2' });
        }

        req.user = rows[0];
         // Après avoir vérifié l'authentification
        
        next();
    } catch (error) { // Corrigez 'err' en 'error'
        console.error('Erreur de vérification du token:', error);
        res.status(401).json({ 
            message: error.name === 'JsonWebTokenError' 
                ? "Token invalide" 
                : "Erreur d'authentification" 
        });
    }
};

module.exports = {
    protectionRoute
}


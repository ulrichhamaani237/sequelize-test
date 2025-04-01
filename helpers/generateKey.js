// Fonction helper pour générer une clé d'accès standardisée
const {formatDateISO}= require('./formatDate')
const crypto = require('crypto')

function genererCleAccesUnifiee({ nom, date_naissance, nom_tuteur }) {
    // Normalisation des données
    const nomNormalise = nom.trim().toUpperCase().replace(/\s+/g, '');
    const dateFormatee = date_naissance ? formatDateISO(date_naissance) : 'NODATE';
    const prenomNormalise = nom_tuteur.trim().toUpperCase().replace(/\s+/g, '');
    
    // Génération d'un hash simple (alternative: utiliser crypto)
    const baseString = `${nomNormalise}_${prenomNormalise}_${dateFormatee}`;
    return crypto.createHash('sha256').update(baseString).digest('hex').substring(0, 12);
}



module.exports = {genererCleAccesUnifiee};
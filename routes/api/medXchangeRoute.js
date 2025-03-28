const express = require('express');
const router = express.Router();
const {getdossier, getAuthorisezeHopital,InsererPatientDossier,AjouterConsultation,AjouterTraitement,registerUtilisateur, LoginUtilisateur,logout} = require('../../controllers/medXchange/test');
const {protectionRoute} =require('../../midleware/protectionRoute')

console.log(protectionRoute);

router.get('/dossier_medical_global', getdossier);
router.post('/consultation', AjouterConsultation);
router.post('/login', LoginUtilisateur);
router.post('/logout', protectionRoute,logout);
router.post('/register', registerUtilisateur);
router.post('/traitement', AjouterTraitement)
router.post('/hopital', getAuthorisezeHopital);
router.post('/dossier_medical_global', InsererPatientDossier);
// Exemple de route protégée
router.get('/profile', protectionRoute, async (req, res) => {
    try {
      res.json({ user: req.user });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });
module.exports = router;
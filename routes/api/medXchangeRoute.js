const express = require('express');
const router = express.Router();
const {getdossier, getAuthorisezeHopital,InsererPatientDossier,AjouterConsultation,AjouterTraitement,registerUtilisateur, LoginUtilisateur,logout} = require('../../controllers/medXchange/test');
const {protectionRoute} =require('../../midleware/protectionRoute')

console.log(protectionRoute);

router.get('/dossier_medical_global',protectionRoute, getdossier);
router.post('/consultation',protectionRoute, AjouterConsultation);
router.post('/login', LoginUtilisateur);
router.post('/logout', protectionRoute,logout);
router.post('/register', registerUtilisateur);
router.post('/traitement', protectionRoute,AjouterTraitement)
router.post('/hopital', protectionRoute,getAuthorisezeHopital);
router.post('/dossier_medical_global',protectionRoute, InsererPatientDossier);



// Exemple de route protégée
router.get('/profile', protectionRoute, async (req, res) => {
    try {
      res.json({ user: req.user });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  router.get('/auth/me', protectionRoute, (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Non autorisé" });
    }
    res.json({ user: req.user });
});

module.exports = router;
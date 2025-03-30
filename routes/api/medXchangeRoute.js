const express = require('express');
const router = express.Router();
const {getdossier, getAuthorisezeHopital,InsererPatientDossier,AjouterConsultation,AjouterTraitement,registerUtilisateur, refreshToken, LoginUtilisateur,logout,getUserDetail, createHopital} = require('../../controllers/medXchange/test');
const {protectionRoute} =require('../../midleware/protectionRoute')

console.log(protectionRoute);

router.get('/dossier_medical_global', getdossier);
router.post('/consultation', AjouterConsultation);
router.get('/user',getUserDetail);
router.post('/login', LoginUtilisateur);
router.post('/updateToken')
router.post('/logout', protectionRoute,logout);
router.post('/addhopitale',createHopital)
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

 
module.exports = router;
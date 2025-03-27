const express = require('express');
const router = express.Router();
const {getdossier, getAuthorisezeHopital,InsererPatientDossier,AjouterConsultation,AjouterTraitement,registerUtilisateur, LoginUtilisateur} = require('../../controllers/medXchange/test');
const {protectionRoute} = require('../../midleware/protectionRoute');


router.get('/dossier_medical_global', getdossier);
router.post('/consultation', AjouterConsultation);
router.post('/login', LoginUtilisateur);
router.post('/register', registerUtilisateur);
router.post('/traitement', AjouterTraitement)
router.post('/hopital', getAuthorisezeHopital);
router.post('/dossier_medical_global', InsererPatientDossier);
module.exports = router;
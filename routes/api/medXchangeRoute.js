const express = require('express');
const router = express.Router();
const {getdossier, getAuthorisezeHopital,InsererPatientDossier} = require('../../controllers/medXchange/test');


router.get('/dossier_medical_global', getdossier);
router.post('/hopital', getAuthorisezeHopital);
router.post('/dossier_medical_global', InsererPatientDossier);
module.exports = router;
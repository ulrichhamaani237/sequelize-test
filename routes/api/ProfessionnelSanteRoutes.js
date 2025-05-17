const express = require('express');
const router = express.Router();
const upload = require('../../uploads/uploadProfess');
const { 
  getAllProfessionnels, 
  importProffessionnelToExcel,
  createProfessionnel,
  ajouterAutorisationDossier,
  supprimerAutorisationDossier,
  getDossiersAutorises,
  demanderAccesDossier,
  updateProfessionnel,
  getDemandesAcces,
  traiterDemandeAcces,
  setActivePersonnel,
  setInactivePersonnel
} = require('../../controllers/ProfessionnelControllers');

// router.get('/getallprofessionnels', getAllProfessionnels);
router.post('/upload', upload.single('file'), importProffessionnelToExcel);

router.post('/create', createProfessionnel);
router.put('/:id_utilisateur', updateProfessionnel);
router.post('/autorisation', ajouterAutorisationDossier);
router.delete('/autorisation/:id_autorisation', supprimerAutorisationDossier);
router.get('/dossiers-autorises/:id_utilisateur', getDossiersAutorises);
router.post('/demande-acces', demanderAccesDossier);
router.get('/demandes-acces', getDemandesAcces);
router.post('/traiter-demande', traiterDemandeAcces);
router.post('/setactivepersonnel/:id_utilisateur', setActivePersonnel);
router.post('/setinactivepersonnel/:id_utilisateur', setInactivePersonnel);

// Add new POST route for getting professionals by hospital ID
router.post('/getprofessionnels', getAllProfessionnels);

module.exports = router;
const express = require('express');
const multer = require('multer');
const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      return cb(new Error("Seuls les fichiers Excel sont acceptés"));
    }
    cb(null, true);
  },
});
const { 
  getAllProfessionnels, 
  impoterProffessionnelToExcel,
  createProfessionnel,
  ajouterAutorisationDossier,
  supprimerAutorisationDossier,
  getDossiersAutorises,
  demanderAccesDossier,
  updateProfessionnel,
  getDemandesAcces,
  traiterDemandeAcces,
  setActivePersonnel,
  setInactivePersonnel,
  getDossiersDisponiblesPourDemande,
} = require('../../controllers/ProfessionnelControllers');

// router.get('/getallprofessionnels', getAllProfessionnels);
router.get('/dossiers-disponibles/:id_utilisateur', getDossiersDisponiblesPourDemande);
router.post('/importPersonnel', upload.single('file'), impoterProffessionnelToExcel);
router.post('/create', createProfessionnel);
router.put('/update id_utilisateur', updateProfessionnel);
router.post('/autorisation', ajouterAutorisationDossier);
router.delete('/autorisation', supprimerAutorisationDossier);
router.get('/dossiers-autorises/:id_utilisateur', getDossiersAutorises);
router.post('/demande-acces', demanderAccesDossier);
router.get('/demandes-acces', getDemandesAcces);
router.post('/traiter-demande', traiterDemandeAcces);
router.post('/setactivepersonnel/:id_utilisateur', setActivePersonnel);
router.post('/setinactivepersonnel/:id_utilisateur', setInactivePersonnel);

// Add new POST route for getting professionals by hospital ID
router.post('/getprofessionnels', getAllProfessionnels);

module.exports = router;
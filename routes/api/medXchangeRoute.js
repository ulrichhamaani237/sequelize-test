const express = require('express');
const multer = require('multer');
const router = express.Router();
const { getdossier, getAuthorisezeHopital, InsererPatientDossier, AjouterConsultation, AjouterTraitement, registerUtilisateur, refreshToken, LoginUtilisateur, logout, getUserDetail, createHopital
  , createNewPatient,
  importDossierMedicaleFromExcel,
  impoterProffessionnelToExcel,
  getAllDataTables,
  getPatientsForshearch,
  getPatientAutorizeHopitale
} = require('../../controllers/medXchange/test');
const { protectionRoute } = require('../../midleware/protectionRoute')
// const upload = require('../../uploads/uploadProfess');
// Dans votre fichier de routes
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      return cb(new Error('Seuls les fichiers Excel sont acceptés'));
    }
    cb(null, true);
  }
});

console.log(protectionRoute);
router.get('/dossier_medical_global', getdossier);
router.get('/patient-for-search', getPatientsForshearch);
router.post('/getdatatable', getAllDataTables)
router.post('/consultation', AjouterConsultation);
router.post('/patient-autorisation-hopitale', getPatientAutorizeHopitale);
router.get('/user', getUserDetail);
router.post('/login', LoginUtilisateur);
router.post('/')
router.post('/newpatient', createNewPatient);
router.post('/logout', protectionRoute, logout);
router.post('/importDossierMedicale', upload.single('file'), importDossierMedicaleFromExcel);
router.post('/importPersonnel', upload.single('file'), impoterProffessionnelToExcel);
router.post('/addhopitale', createHopital)
router.post('/register', registerUtilisateur);
router.post('/traitement', protectionRoute, AjouterTraitement)
router.post('/autorisation-hopitale', getAuthorisezeHopital);
router.post('/dossier_medical_global', protectionRoute, InsererPatientDossier);



// Exemple de route protégée
router.get('/profile', protectionRoute, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});


module.exports = router;
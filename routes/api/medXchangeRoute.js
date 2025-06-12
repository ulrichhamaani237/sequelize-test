const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  getdossier,
  getAuthorisezeHopital,
  InsererPatientDossier,
  AjouterConsultation,
  AjouterTraitement,
  registerUtilisateur,
  refreshToken,
  LoginUtilisateur,
  logout,
  getUserDetail,
  createHopital,
  createNewPatient,
  importDossierMedicaleFromExcel,
  impoterProffessionnelToExcel,
  getAllDataTables,
  getPatientsForshearch,
  getPatientAutorizeHopitale,
  
} = require("../../controllers/medXchange/test");
const {dossierDetails, getConsultation,deletePatient,
  deleteConsultation, editPatient, getPatientById, 
  addPatient,setActivePersonnel,setInactivePersonnel,
  editPersonnel,addPersonnel,getPersonnelById,loginpatient,
  getconsultationforpatient, updatePatientPaymentStatus, getAllPatients, getDossierById} = require('../../controllers/medXchange/DossiersControllers')
const {
  notifications,
  sendNotifications,
} = require("../../controllers/medXchange/notification");
const { protectionRoute } = require("../../midleware/protectionRoute");
const { getLogs } = require("../../controllers/medXchange/LogsControllers");
// const upload = require('../../uploads/uploadProfess');
// Dans votre fichier de routes
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

// console.log(protectionRoute);
router.post("/dossier_medical_global", getdossier);
router.get("/patient-for-search", getPatientsForshearch);
router.get('/getdossier/:id_dossier', getDossierById);
router.post("/deletepatient", deletePatient);
router.post("/editpatient/:id_patient", editPatient);
router.post("/addpatient/:id_hopital", addPatient);
router.post("/setactivepersonnel/:id_utilisateur", setActivePersonnel);
router.post("/setinactivepersonnel/:id_utilisateur", setInactivePersonnel);
router.post("/editpersonnel/:id_utilisateur", editPersonnel);
router.post("/addpersonnel/:id_hopital", addPersonnel);
router.get("/getpersonnel/:id_utilisateur", getPersonnelById);
router.get("/getpatient/:id_patient", getPatientById);
router.post("/deleteconsultation", deleteConsultation);
router.post("/getdatatable", getAllDataTables);
router.post("/getconsultationforpatient/:id_dossier",getConsultation);
router.post("/consultation",upload.single("file"), AjouterConsultation);
router.post("/patient-autorisation-hopitale", getPatientAutorizeHopitale);
router.get("/user", getUserDetail);
router.post("/login", LoginUtilisateur);
router.post("/loginpatient", loginpatient);
router.post("/newpatient", createNewPatient);
router.post("/logout", protectionRoute, logout);
router.post("/logs",getLogs);
router.post(
  "/importDossierMedicale",
  upload.single("file"),
  importDossierMedicaleFromExcel
);
router.post(
  "/importPersonnel",
  upload.single("file"),
  impoterProffessionnelToExcel
);
router.post("/addhopitale", createHopital);
router.post("/register", registerUtilisateur);
router.post("/traitement", protectionRoute, AjouterTraitement);
router.post("/autorisation-hopitale", getAuthorisezeHopital);
router.post("/dossier_medical_global", protectionRoute, InsererPatientDossier);

// Exemple de route protégée
router.get("/profile", protectionRoute, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// notifacations ----------------------------------------------------------------------------
router.get('/notifications/:id_utilisateur', notifications);
router.post('/notifications', sendNotifications); // Correction: Ajouter '/' avant 'notifications'

//dossier -----------------------------------------------------------------------------------

router.post('/dossierdetails/:id_dossier', dossierDetails)

// Route pour mettre à jour le statut de paiement d'un patient
router.post('/updatePatientPaymentStatus/:id_patient', updatePatientPaymentStatus);

// Route pour obtenir tous les patients d'un hôpital
router.post('/all/patients', getAllPatients);

module.exports = router;
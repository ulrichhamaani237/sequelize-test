const express = require('express')
const {createPatient, importPatientsFromExcel, getAllPatient, deletePatient, EditPatient, getPatientById} = require('../../controllers/PatientController')
const fileUpload = require('express-fileupload')

const uploadOpts = {
    useTempFiles: true,
    tempFileDir: '/tmp/'
}


const router = express.Router();

// route de creation du patient
router.post('/createpatient',createPatient);
router.get('/getallpatients',getAllPatient);
router.post('/deletepatient/:id',deletePatient);
router.get('/getallpatients',getAllPatient);
router.put('/editpatient/:id',EditPatient);
router.get('/getpatient/:id',getPatientById);
router.post('/importpatients', fileUpload(uploadOpts), importPatientsFromExcel);

module.exports = router;
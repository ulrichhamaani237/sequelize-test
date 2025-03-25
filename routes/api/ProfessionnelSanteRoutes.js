const express = require('express');
const router = express.Router();
const upload = require('../../uploads/uploadProfess');
const { getAllProfessionnels, importProffessionnelToExcel } = require('../../controllers/PrefessionnelControllers');

router.get('/getallprofessionnels', getAllProfessionnels);
router.post('/upload', upload.single('file'), importProffessionnelToExcel);

module.exports = router;
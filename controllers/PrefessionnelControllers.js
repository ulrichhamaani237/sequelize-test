const { ProfessionnelSante } = require('../models');
const xlsx = require('xlsx');
const upload = require('../uploads/uploadProfess');

const importProffessionnelToExcel = async (req, res) => {
  try {
    // Vérifier si le fichier a été récupéré
    if (!req.file) {
      console.log('Aucun fichier sélectionné');
      return res.status(400).json({ message: "Aucun fichier sélectionné" });
    }

    const filePath = req.file.path; // Chemin du fichier uploadé
    console.log('Chemin du fichier:', filePath);

    // Récupération des données dans le fichier Excel
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Récupérer le nom de la première feuille
    const sheet = workbook.Sheets[sheetName]; // Récupérer la feuille

    // Convertir la feuille en JSON
    const jsonData = xlsx.utils.sheet_to_json(sheet);
    console.log('Données JSON:', jsonData);

    // Enregistrer les données dans la base de données
    for (const row of jsonData) {
      await ProfessionnelSante.create(row);
    }

    console.log('Fichier importé avec succès');
    res.status(200).json({ message: 'Fichier importé avec succès', data: jsonData });
  } catch (error) {
    console.error('Erreur lors de l\'importation du fichier:', error);
    res.status(500).json({ message: error.message });
  }
};

const getAllProfessionnels = async (req, res) => {
  try {
    const professionnels = await ProfessionnelSante.findAll();
    res.status(200).json(professionnels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  importProffessionnelToExcel,
  getAllProfessionnels,
};
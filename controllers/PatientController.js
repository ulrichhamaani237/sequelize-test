const { Patient } = require('../models'); 
const xlsx = require('xlsx');
const fs = require('fs');
const { where } = require('sequelize');


const createPatient = async (req, res) => {
  try {
    // 1. Récupérer les données du corps de la requête
    const {
      nom,
      prenom,
      dateDeNaissance,
      age,
      sexe,
      adresse,
      ville,
      telephone,
      email,
      groupeSanguin,
      statut,
      photo,
      profession,
      contactUrgent,
      contactUrgenceNom,
    } = req.body;

    // 2. Validation des données (exemple simple)
    if (!nom || !prenom || !dateDeNaissance || !age || !sexe || !adresse || !ville || !telephone) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis.' });
    }

    // 3. Créer un nouveau patient dans la base de données
    const nouveauPatient = await Patient.create({
      nom,
      prenom,
      dateDeNaissance,
      age,
      sexe,
      adresse,
      ville,
      telephone,
      email: email || null, 
      groupeSanguin: groupeSanguin || null, 
      statut: statut || 'Actif',  
      photo: photo || null, 
      profession: profession || null,
      contactUrgent: contactUrgent || null, 
      contactUrgenceNom: contactUrgenceNom || null,  
    });

    // 4. Renvoyer une réponse réussie avec le patient créé
    res.status(201).json({
      message: 'Patient créé avec succès.',
      patient: nouveauPatient,
    });
  } catch (error) {
    // 5. Gérer les erreurs
    console.error('Erreur lors de la création du patient :', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors de la création du patient.',
      error: error.message,
    });
  }
};


const importPatientsFromExcel = async (req, res) => {
    try {
      const {excel} = req.files
      console.log(excel);
      
    } catch (error) {
     
    }
  };
const getAllPatient = async  (req, res) =>{


  try {
    const allPatient = await Patient.findAll();
  
    res.status(200).json(allPatient);

  } catch (err) {
    res.status(500).json({message: "Erreur de recuperation des patients "})
  } finally {
    
  }
  
}


const EditPatient = async (req, res) => {
  const {
    nom,
    prenom,
    dateDeNaissance,
    age,
    sexe,
    adresse,
    ville,
    telephone,
    email,
    groupeSanguin,
    statut,
    photo,
    profession,
    contactUrgent,
    contactUrgenceNom,
  } = req.body;

  const { id } = req.params;

  try {
    // Vérifier si le patient existe
    const patient = await Patient.findByPk(id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Mettre à jour le patient
    await Patient.update(
      {
        nom,
        prenom,
        dateDeNaissance,
        age,
        sexe,
        adresse,
        ville,
        telephone,
        email,
        groupeSanguin,
        statut,
        photo,
        profession,
        contactUrgent,
        contactUrgenceNom,
      },
      {
        where: { id }, // Condition pour trouver le patient à mettre à jour
      }
    );

    // Récupérer le patient mis à jour
    const updatedPatient = await Patient.findByPk(id);
    res.status(200).json(updatedPatient);
    console.log("Patient mis à jour avec succès");
  } catch (err) {
    console.error("Erreur lors de la mise à jour du patient :", err);
    res.status(500).json({ message: "Erreur s'est produite", error: err.message });
  }
};

const deletePatient = async (req, res) =>{

  const { id } = req.params;

  const patient  = await  Patient.findByPk(id);
  if (!patient) {
    alert('Patient non retrouver')
  }

  try {
    await patient.destroy({
      where: {
        id:  req.params.id
      }
    })

    res.status(200).json(patient)
  } catch (error) {
    res.status(500).json({message: "Erreur de suppression"})
  }


}

const getPatientById = async (req, res) => {
  const { id } = req.params;

  try {
    const patient = await Patient.findByPk(id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.status(200).json(patient);
  } catch (error) {
    console.error('Error while getting patient by id:', error);
    res.status(500).json({ message: 'Error while getting patient by id' });
  }
}

module.exports = {
  createPatient,
  importPatientsFromExcel,
  getAllPatient,
  EditPatient,
  deletePatient,
  getPatientById
};
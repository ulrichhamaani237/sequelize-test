require("dotenv").config();
const { query } = require("../../config/db");
const { sendBulkNotifications } = require("./notification");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");


const addPersonnel = async (req, res) => {
  try {

    const {
      nom,
      prenom,
      email,
      mot_de_passe_hash,
      role,
      sexe,
      specialite } = req.body;

    const id_hopital = req.params.id_hopital;

    if (!nom || !prenom || !email || !mot_de_passe_hash || !role || !id_hopital || !specialite || !sexe) {
      return res.status(400).json({ success: false, message: "Tous les champs sont obligatoires" });
    }

    const motDePasseHash = await bcrypt.hash(mot_de_passe_hash, 10);

    const personnel = await query(
      `INSERT INTO utilisateur(nom, prenom, email,mot_de_passe_hash,role,id_hopital,specialite,sexe)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
      `,
      [nom, prenom, email, motDePasseHash, role, id_hopital, specialite, sexe]
    )

    if (!personnel.rows.length) {
      return res.status(400).json({
        success: false,
        message: "erreur lors de l inserton"
      })
    }

    return res.status(201).json({
      success: true,
      message: "Personnel ajouté avec succès",
      personnel: personnel.rows[0]
    })

  } catch (error) {
    console.error("Erreur lors de l'ajout du personnel:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de l'ajout du personnel" });
  }
}

const getPersonnelById = async (req, res) => {
  try {
    const id_utilisateur = req.params.id_utilisateur;
    const personnel = await query(
      `SELECT * FROM utilisateur WHERE id_utilisateur = $1`,
      [id_utilisateur]
    );
    if (!personnel.rows.length) {
      return res.status(404).json({ success: false, message: "Personnel non trouvé" });
    }
    return res.status(200).json({ success: true, message: "Personnel trouvé avec succès", personnel: personnel.rows[0] });
  } catch (error) {
    console.error("Erreur lors de la recherche du personnel:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la recherche du personnel" });
  }
}

const editPersonnel = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe_hash, role, specialite, sexe } = req.body;
    const id_utilisateur = req.params.id_utilisateur;
    if (!id_utilisateur || !nom || !prenom || !email || !mot_de_passe_hash || !role || !specialite || !sexe) {
      return res.status(400).json({ success: false, message: "Tous les champs sont obligatoires" });
    }
    const personnel = await query(
      `UPDATE utilisateur SET nom = $1, prenom = $2, email = $3, mot_de_passe_hash = $4, role = $5, specialite = $6,sexe = $7 WHERE id_utilisateur = $8 RETURNING *`,
      [nom, prenom, email, mot_de_passe_hash, role, specialite, sexe, id_utilisateur]
    );
    if (!personnel.rows.length) {
      return res.status(404).json({ success: false, message: "Personnel non trouvé" });
    }
    return res.status(200).json({ success: true, message: "Personnel modifié avec succès", personnel: personnel.rows[0] });
  } catch (error) {
    console.error("Erreur lors de la modification du personnel:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la modification du personnel" });
  }
}

const setActivePersonnel = async (req, res) => {
  try {
    const id_utilisateur = req.params.id_utilisateur;
    const personnel = await query(
      `UPDATE utilisateur SET is_not_active = $1 WHERE id_utilisateur = $2 RETURNING *`,
      [true, id_utilisateur]
    );
    if (!personnel.rows.length) {
      return res.status(404).json({ success: false, message: "Personnel non trouvé" });
    }
    return res.status(200).json({ success: true, message: "Personnel activé avec succès", personnel: personnel.rows[0] });
  } catch (error) {
    console.error("Erreur lors de l'activation du personnel:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de l'activation du personnel" });
  }
}

const setInactivePersonnel = async (req, res) => {
  try {
    const id_utilisateur = req.params.id_utilisateur;
    const personnel = await query(
      `UPDATE utilisateur SET is_not_active = $1 WHERE id_utilisateur = $2 RETURNING *`,
      [false, id_utilisateur]
    );
    if (!personnel.rows.length) {
      return res.status(404).json({ success: false, message: "Personnel non trouvé" });
    }
    return res.status(200).json({ success: true, message: "Personnel desactivé avec succès", personnel: personnel.rows[0] });
  } catch (error) {
    console.error("Erreur lors de la desactivation du personnel:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la desactivation du personnel" });
  }
}

const addPatient = async (req, res) => {
  try {
    const { nom, prenom, date_naissance, age, sexe, taille, adresse, nom_tuteur, photo } = req.body;
    const id_hopital = req.params.id_hopital;  // Au lieu de req.params 
    if (!id_hopital || !nom || !prenom || !date_naissance || !age || !sexe || !taille || !adresse || !nom_tuteur) {
      return res.status(400).json({ success: false, message: "Tous les champs sont obligatoires" });
    }

    const patient = await query(
      `INSERT INTO patient (nom, prenom, date_naissance, nom_tuteur,id_hopital, adresse,sexe, age, taille, photo) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING *`,
      [nom, prenom, date_naissance, nom_tuteur, id_hopital, adresse, sexe, age, taille, photo]
    );

    if (!patient.rows.length) {
      return res.status(404).json({ success: false, message: "Patient non trouvé" });
    }

    const dossier = await query(
      `INSERT INTO dossier_medical_global (id_patient,id_hopital,date_creation) 
             VALUES ($1,$2,$3) 
             RETURNING *`,
      [patient.rows[0].id_patient, id_hopital, new Date()]
    );

    if (!dossier.rows.length) {
      return res.status(404).json({ success: false, message: "Dossier non trouvé" });
    }

    return res.status(201).json({ success: true, message: "Patient ajouté avec succès", patient: patient.rows[0], dossier: dossier.rows[0] });
  } catch (error) {
    console.error("Erreur lors de l'ajout du patient:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de l'ajout du patient" });
  }
}

// Configuration de multer pour les PDF
const storagePdf = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/pdfs'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const uploadPdf = multer({
  storage: storagePdf,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont autorisés'));
    }
  }
});

// Configuration de multer pour les images
const storageImage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/images'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const uploadImage = multer({
  storage: storageImage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image sont autorisés'));
    }
  }
});

// Contrôleur pour ajouter un PDF
const ajouterFichierPdf = async (req, res) => {

  uploadPdf.single('pdf')(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier PDF fourni' });
    }
    // On suppose que l'id de la consultation est envoyé dans le body
    const { id_consultation } = req.params;
    if (!id_consultation) {
      return res.status(400).json({ success: false, message: "id_consultation manquant" });
    }
    try {
      await query(
        "UPDATE consultation SET detail->>'carnet' = $1 WHERE id_consultation = $2",
        [req.file.filename, id_consultation]
      );
      return res.status(200).json({ success: true, message: 'PDF uploadé et lié à la consultation', file: req.file.filename });
    } catch (e) {
      return res.status(500).json({ success: false, message: "Erreur lors de l'insertion dans la base de données", error: e.message });
    }
  });
};

// Contrôleur pour ajouter une image
const ajouterImage = async (req, res) => {
  uploadImage.single('image')(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucune image fournie' });
    }
    // On suppose que l'id de la consultation est envoyé dans le body
    const { id_consultation } = req.params;
    if (!id_consultation) {
      return res.status(400).json({ success: false, message: "id_consultation manquant" });
    }
    try {
      await query(
        "UPDATE consultation SET image = $1 WHERE id_consultation = $2",
        [req.file.filename, id_consultation]
      );
      return res.status(200).json({ success: true, message: 'Image uploadée et liée à la consultation', file: req.file.filename });
    } catch (e) {
      return res.status(500).json({ success: false, message: "Erreur lors de l'insertion dans la base de données", error: e.message });
    }
  });
};

const dossierDetails = async (req, res) => {
  const { id_dossier } = req.params;
  const { id_hopital } = req.body;
  const { id_utilisateur } = req.body;
  try {
    if (!id_dossier) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant du dossier est requis",
      });
    }

    if (!id_hopital) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à cet hôpital",
      });
    }

    // Requête SQL pour recuperer les données du dossier et du patient
    const dossierDetail = await query(
      `
      SELECT p.*, d.* 
      FROM dossier_medical_global d
      JOIN patient p ON d.id_patient = p.id_patient
      JOIN hopital h ON h.id_hopital = d.id_hopital
      WHERE h.id_hopital = $1 AND d.id_dossier = $2
    `,
      [id_hopital, id_dossier]
    );

    // Gestion des résultats
    if (dossierDetail.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Dossier médical non trouvé",
      });
    }

    const usersArryId = await query(
      `SELECT id_utilisateur FROM utilisateur WHERE id_hopital = $1`,
      [id_hopital]
    );

    if (usersArryId.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun utilisateur trouvé",
      });
    }

    const ArrayId = usersArryId.rows;
    const user = await query(
      `SELECT * FROM utilisateur WHERE id_utilisateur = $1`,
      [id_utilisateur]
    )

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun utilisateur rencontré",
      });
    }

    const message = `le dossier medicale de ${dossierDetail.rows[0].nom} ${dossierDetail.rows[0].prenom} a ete consulter par ${user.rows[0].nom} ${user.rows[0].prenom}`;
    const notify = await sendBulkNotifications(
      message,
      ArrayId.map((user) => user.id_utilisateur),
      "system"
    );

    if (!notify.success) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi des notifications",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Dossier trouvé avec succès",
      data: dossierDetail.rows[0],
      notify: notify.message,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du dossier:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération du dossier",
    });
  }
};

const getConsultation = async (req, res) => {
  const { id_dossier } = req.params;

  try {
    const consultation = await query(
      `SELECT 
        c.*, 
        u.nom, 
        u.prenom, 
        u.role,
        (c.detail->>'dateConsultation') as date_consultation_detail,
        (c.detail->>'heureConsultation') as heure_consultation_detail,
        (c.detail->>'typeConsultation') as type_consultation,
        (c.detail->>'motif') as motif,
        (c.detail->>'temperature') as temperature,
        (c.detail->>'poids') as poids,
        (c.detail->>'taille') as taille,
        (c.detail->>'tensionArterielle') as tension_arterielle,
        (c.detail->>'frequenceCardiaque') as frequence_cardiaque,
        (c.detail->>'saturationOxygene') as saturation_oxygene,
        (c.detail->>'symptomes') as symptomes,
        (c.detail->>'debutSymptomes') as debut_symptomes,
        (c.detail->>'intensiteDouleur') as intensite_douleur,
        (c.detail->>'etatGeneral') as etat_general,
        (c.detail->>'conscience') as conscience,
        (c.detail->>'examenPhysique') as examen_physique,
        (c.detail->>'antecedentsMedicaux') as antecedents_medicaux,
        (c.detail->>'allergies') as allergies,
        (c.detail->>'medicamentsActuels') as medicaments_actuels,
        (c.detail->>'diagnostic') as diagnostic,
        (c.detail->>'diagnosticSecondaire') as diagnostic_secondaire,
        (c.detail->>'traitement') as traitement,
        (c.detail->>'prescription') as prescription,
        (c.detail->>'examensComplementaires') as examens_complementaires,
        (c.detail->>'recommandations') as recommandations,
        (c.detail->>'prochainRendezVous') as prochain_rendez_vous,
        (c.detail->>'orientationSpecialiste') as orientation_specialiste,
        (c.detail->>'specialiste') as specialiste,
        (c.detail->>'prescriptionMedicaments') as prescriptionMedicaments
      FROM consultation c
      JOIN utilisateur u ON c.id_utilisateur = u.id_utilisateur
      WHERE id_dossier = $1 ORDER BY date_consultation DESC`,
      [id_dossier]
    );
    const consult = await query(
      `SELECT 
    c.*, 
    u.nom, 
    u.prenom, 
    u.role,
    (c.detail->>'dateConsultation') as date_consultation_detail,
    (c.detail->>'heureConsultation') as heure_consultation_detail,
    (c.detail->>'typeConsultation') as type_consultation,
    (c.detail->>'motif') as motif,
    (c.detail->>'temperature') as temperature,
    (c.detail->>'poids') as poids,
    (c.detail->>'taille') as taille,
    (c.detail->>'tensionArterielle') as tension_arterielle,
    (c.detail->>'frequenceCardiaque') as frequence_cardiaque,
    (c.detail->>'saturationOxygene') as saturation_oxygene,
    (c.detail->>'symptomes') as symptomes,
    (c.detail->>'debutSymptomes') as debut_symptomes,
    (c.detail->>'intensiteDouleur') as intensite_douleur,
    (c.detail->>'etatGeneral') as etat_general,
    (c.detail->>'conscience') as conscience,
    (c.detail->>'examenPhysique') as examen_physique,
    (c.detail->>'antecedentsMedicaux') as antecedents_medicaux,
    (c.detail->>'allergies') as allergies,
    (c.detail->>'medicamentsActuels') as medicaments_actuels,
    (c.detail->>'diagnostic') as diagnostic,
    (c.detail->>'diagnosticSecondaire') as diagnostic_secondaire,
    (c.detail->>'traitement') as traitement,
    (c.detail->>'prescription') as prescription,
    (c.detail->>'examensComplementaires') as examens_complementaires,
    (c.detail->>'recommandations') as recommandations,
    (c.detail->>'prochainRendezVous') as prochain_rendez_vous,
    (c.detail->>'orientationSpecialiste') as orientation_specialiste,
    (c.detail->>'specialiste') as specialiste
  FROM consultation c
  JOIN utilisateur u ON c.id_utilisateur = u.id_utilisateur
  WHERE id_dossier = $1 ORDER BY date_consultation DESC LIMIT 2`,
      [id_dossier]
    );
    if (consultation.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucune consultation trouvée"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Consultations trouvées",
      data: {
        alldata: consultation.rows,
        twodata: consult.rows
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des consultations:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des consultations"
    });
  }
}

const deleteDossier = async (req, res) => {

  const { id_dossier } = req.body;

  try {
    const dossier = await query(
      `DELETE FROM dossier_medical_global WHERE id_dossier = $1`,
      [id_dossier]
    );
    return res.status(200).json({
      success: true,
      message: "Dossier supprimé avec succès"
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du dossier:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression du dossier"
    });
  }

}

const deletePatient = async (req, res) => {
  const { id_patient } = req.body;

  try {
    const patient = await query(
      `DELETE FROM patient WHERE id_patient = $1`,
      [id_patient]
    );
    return res.status(200).json({
      success: true,
      message: "Patient supprimé avec succès"
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du patient:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression du patient"
    });
  }

}

const deleteConsultation = async (req, res) => {
  const { id_consultation } = req.body;

  try {
    const consultation = await query(
      `DELETE FROM consultation WHERE id_consultation = $1`,
      [id_consultation]
    );
    return res.status(200).json({
      success: true,
      message: "Consultation supprimée avec succès"
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la consultation:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression de la consultation"
    });
  }

}

const editPatient = async (req, res) => {
  const {
    nom,
    prenom,
    date_naissance,
    nom_tuteur,
    id_hopital,
    adresse,
    donnees,
    code,
    sexe,
    taille,
    age,
    photo
  } = req.body;
  const { id_patient } = req.params;

  try {
    const patient = await query(
      `UPDATE patient 
             SET nom = $1, 
                 prenom = $2, 
                 date_naissance = $3, 
                 nom_tuteur = $4, 
                 id_hopital = $5, 
                 adresse = $6, 
                 donnees = $7, 
                 code = $8, 
                 sexe = $9, 
                 taille = $10, 
                 age = $11,
                 photo = $12 
             WHERE id_patient = $13`,
      [nom, prenom, date_naissance, nom_tuteur, id_hopital, adresse, donnees, code, sexe, taille, age, photo, id_patient]
    );
    if (!patient.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Patient non trouvé"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient modifié avec succès"
    });
  } catch (error) {
    console.error("Erreur lors de la modification du patient:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la modification du patient",
      error: error.message
    });
  }
};

const getPatientById = async (req, res) => {
  const { id_patient } = req.params;
  try {
    const patient = await query(
      `SELECT * FROM patient WHERE id_patient = $1`,
      [id_patient]
    );

    if (!patient.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Patient non trouvé"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient trouvé avec succès",
      data: patient.rows[0]
    });
  } catch (error) {
    console.error("Erreur lors de la recherche du patient:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche du patient",
      error: error.message
    });
  }
};




module.exports = {
  dossierDetails,
  getConsultation,
  ajouterFichierPdf,
  ajouterImage,
  deleteDossier,
  deletePatient,
  deleteConsultation,
  editPatient,
  getPatientById,
  addPatient,
  setActivePersonnel,
  setInactivePersonnel,
  editPersonnel,
  addPersonnel,
  getPersonnelById
};

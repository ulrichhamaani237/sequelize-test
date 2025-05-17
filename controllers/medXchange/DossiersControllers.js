require("dotenv").config();
const { query } = require("../../config/db");
const { sendBulkNotifications } = require("./notification");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const { createGenesisBlock, addrecordBlockchain } = require("../../blockchaine/medicalBlockchain");
const { SHA256 } = require("crypto-js");
const CryptoJS = require("crypto-js");
const { ec: EC } = require("elliptic");
const ec = new EC("secp256k1");
const crypto = require("crypto");
const jwt = require('jsonwebtoken');


/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns  
 * 
 */
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

/**
 * @description 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
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

/**
 * @description edit personnel
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
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


/**
 * @description fonction pour ajouter un patient et enregistrer dans la blockchaine
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const addPatient = async (req, res) => {
  try {
    const {
      nom, prenom, date_naissance, age, sexe, taille, email,
      adresse, nom_tuteur, photo, id_utilisateur, mot_de_passe, tel,
      is_paid // Nouveau champ pour le statut de paiement
    } = req.body;

    // Vérification des champs obligatoires
    const requiredFields = {
      id_hopital: req.params.id_hopital,
      nom, prenom, date_naissance, age, sexe,
      taille, adresse, nom_tuteur, id_utilisateur,
      mot_de_passe, tel, email
    };

    // Vérifier si tous les champs requis sont présents
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => value === undefined || value === null || value === '')
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Champs manquants: ${missingFields.join(', ')}`
      });
    }

    // Vérifier si l'utilisateur existe
    const userCheck = await query('SELECT id_utilisateur FROM utilisateur WHERE id_utilisateur = $1', [id_utilisateur]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "L'utilisateur spécifié n'existe pas"
      });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Insertion du patient avec le nouveau champ is_paid
    const patient = await query(
      `INSERT INTO patient 
       (nom, prenom, date_naissance, nom_tuteur, id_hopital, adresse, 
        sexe, age, taille, photo, tel, email, password, is_paid)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        nom, prenom, date_naissance, nom_tuteur, req.params.id_hopital,
        adresse, sexe, age, taille, photo, tel, email, hashedPassword,
        is_paid !== undefined ? is_paid : false // Valeur par défaut false si non spécifié
      ]
    );

    if (!patient.rows.length) {
      return res.status(400).json({
        success: false,
        message: "Erreur lors de la création du patient"
      });
    }

    // Créer automatiquement un dossier médical pour le nouveau patient
    try {
      const newDossier = await query(
        `INSERT INTO dossier_medical_global 
         (id_patient, id_hopital, date_creation, derniere_modification)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING *`,
        [patient.rows[0].id_patient, req.params.id_hopital]
      );
      
      res.status(201).json({
        success: true,
        message: "Patient créé avec succès",
        data: {
          ...patient.rows[0],
          dossier: newDossier.rows[0]
        }
      });
    } catch (dossierError) {
      console.error("Erreur lors de la création du dossier médical:", dossierError);
      // Le patient a été créé, mais pas le dossier - on informe l'utilisateur
      res.status(201).json({
        success: true,
        warning: "Patient créé, mais erreur lors de la création du dossier médical",
        data: patient.rows[0]
      });
    }

  } catch (error) {
    console.error("Erreur lors de l'ajout du patient:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};

const loginpatient = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    if (!email || !mot_de_passe) {
      return res.status(400).json({ success: false, message: "Tous les champs sont obligatoires" });
    }
    const utilisateur = await query(
      `SELECT * FROM patient WHERE email = $1`,
      [email]
    );
    if (!utilisateur.rows.length) {
      return res.status(404).json({ success: false, message: "Patient non trouvé" });
    }
    const utilisateurData = utilisateur.rows[0];
    console.log("Utilisateur trouvé :", utilisateurData);

    // Vérifie que le champ du mot de passe existe
    if (!utilisateurData.password) {
      console.error("Champ password manquant dans la base de données");
      return res.status(500).json({ success: false, message: "Erreur interne: champ password manquant" });
    }

    const motDePasseHash = await bcrypt.compare(mot_de_passe, utilisateurData.password);
    if (!motDePasseHash) {
      return res.status(401).json({ success: false, message: "Mot de passe incorrect" });
    }
    if (!process.env.TOKEN_KEY) {
      console.error("TOKEN_KEY non défini dans les variables d'environnement");
      return res.status(500).json({ success: false, message: "Erreur de configuration du serveur" });
    }
    const token = jwt.sign({ id_patient: utilisateurData.id_patient }, process.env.TOKEN_KEY, { expiresIn: '10d' });
    const updatetoken = await query(
      `UPDATE patient SET token = $1 WHERE id_patient = $2 RETURNING *`,
      [token, utilisateurData.id_patient]
    );
    if (!updatetoken.rows.length) {
      return res.status(404).json({ success: false, message: "Patient non trouvé" });
    }
    return res.status(200).json({ success: true, message: "Connexion reussie", utilisateur: utilisateurData, token });
  } catch (error) {
    console.error("Erreur lors de la connexion du patinent:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la connexion" });
  }
}



const getPrestatairepatient = async (req, res) => {
  try {

    const { id_patient } = req.body
    if (!id_patient) {
      return res.status(400).json({
        success: false,
        message: "champs id_patient requise"
      })
    }

    const prestatairePatient = await query(`
      SELECT FROM utilisateur WHERE id_patient = $1`,
      [id_patient]
    )
    if (!prestatairePatient.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Prestataire non trouvé"
      })
    }
    return res.status(200).json({
      success: true,
      message: "Prestataire trouvé",
      prestataire: prestatairePatient.rows[0]
    })
  } catch (error) {
    console.error("Erreur lors de la récupération du prestataire:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du prestataire"
    })
  }
}

const dossierforpatient = async (req, res)  =>{

  try {
    const {id_patient} = req.body
    if (!id_patient) {
      return res.status(400).json({
        success: false,
        message: "champs id_patient requise"
      })
    }
    const dossierPatient = await query(`
      SELECT C.detail FROM consultation as C
      JOIN patient as P ON C.id_patient = P.id_patient
      WHERE P.id_patient = $1`,
      [id_patient]
    )
    if (!dossierPatient.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Dossier non trouvé"
      })
    }
    return res.status(200).json({
      success: true,
      message: "Dossier trouvé",
      dossier: dossierPatient.rows[0]
    })
  } catch (error) {
    console.error("Erreur lors de la récupération du dossier:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du dossier"
    })
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

/**
 * @description delete patient
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const deletePatient = async (req, res) => {
  try {
    const { id_patient } = req.body;

    if (!id_patient) {
      return res.status(400).json({
        success: false, 
        message: "ID patient requis"
      });
    }

    // Vérifier si le patient existe
    const patientExists = await query(
      `SELECT id_patient FROM patient WHERE id_patient = $1`,
      [id_patient]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient non trouvé"
      });
    }

    // Récupérer les dossiers médicaux associés au patient
    const dossiers = await query(
      `SELECT id_dossier FROM dossier_medical_global WHERE id_patient = $1`,
      [id_patient]
    );

    // Pour chaque dossier, supprimer les consultations associées
    for (const dossier of dossiers.rows) {
      await query(
        `DELETE FROM consultation WHERE id_dossier = $1`,
        [dossier.id_dossier]
      );
    }

    // Supprimer les dossiers médicaux
    if (dossiers.rows.length > 0) {
      await query(
        `DELETE FROM dossier_medical_global WHERE id_patient = $1`,
        [id_patient]
      );
    }

    // Supprimer le patient
    const result = await query(
      `DELETE FROM patient WHERE id_patient = $1 RETURNING *`,
      [id_patient]
    );

    return res.status(200).json({
      success: true,
      message: "Patient supprimé avec succès",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du patient:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du patient",
      error: error.message
    });
  }
};

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
    photo,
    tel,
    email,
    is_paid // Nouveau champ
  } = req.body;
  const { id_patient } = req.params;

  try {
    // Vérifier si le patient existe
    const patientExists = await query(
      `SELECT id_patient FROM patient WHERE id_patient = $1`,
      [id_patient]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient non trouvé"
      });
    }

    // Construire la requête dynamiquement pour ne mettre à jour que les champs fournis
    let updateFields = [];
    let params = [];
    let paramIndex = 1;

    // Ajouter chaque champ à la requête uniquement s'il est défini
    if (nom !== undefined) {
      updateFields.push(`nom = $${paramIndex++}`);
      params.push(nom);
    }
    if (prenom !== undefined) {
      updateFields.push(`prenom = $${paramIndex++}`);
      params.push(prenom);
    }
    if (date_naissance !== undefined) {
      updateFields.push(`date_naissance = $${paramIndex++}`);
      params.push(date_naissance);
    }
    if (nom_tuteur !== undefined) {
      updateFields.push(`nom_tuteur = $${paramIndex++}`);
      params.push(nom_tuteur);
    }
    if (id_hopital !== undefined) {
      updateFields.push(`id_hopital = $${paramIndex++}`);
      params.push(id_hopital);
    }
    if (adresse !== undefined) {
      updateFields.push(`adresse = $${paramIndex++}`);
      params.push(adresse);
    }
    if (donnees !== undefined) {
      updateFields.push(`donnees = $${paramIndex++}`);
      params.push(donnees);
    }
    if (code !== undefined) {
      updateFields.push(`code = $${paramIndex++}`);
      params.push(code);
    }
    if (sexe !== undefined) {
      updateFields.push(`sexe = $${paramIndex++}`);
      params.push(sexe);
    }
    if (taille !== undefined) {
      updateFields.push(`taille = $${paramIndex++}`);
      params.push(taille);
    }
    if (age !== undefined) {
      updateFields.push(`age = $${paramIndex++}`);
      params.push(age);
    }
    if (photo !== undefined) {
      updateFields.push(`photo = $${paramIndex++}`);
      params.push(photo);
    }
    if (tel !== undefined) {
      updateFields.push(`tel = $${paramIndex++}`);
      params.push(tel);
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      params.push(email);
    }
    if (is_paid !== undefined) {
      updateFields.push(`is_paid = $${paramIndex++}`);
      params.push(is_paid);
    }

    // Ajouter l'ID patient comme dernier paramètre
    params.push(id_patient);

    // Exécuter la requête seulement si des champs sont à mettre à jour
    if (updateFields.length > 0) {
      const query_string = `
        UPDATE patient 
        SET ${updateFields.join(', ')} 
        WHERE id_patient = $${paramIndex}
        RETURNING *
      `;

      const result = await query(query_string, params);

      return res.status(200).json({
        success: true,
        message: "Patient modifié avec succès",
        data: result.rows[0]
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Aucune donnée fournie pour la mise à jour"
      });
    }
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

/**
 * @description get consultation for patient
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getconsultationforpatient = async (req, res) => {

  try {
    const { id_patient } = req.params;
    if (!id_patient) {
      return res.status(400).json({ 
        success: false,
        message: "id_patient manquant" 
      });
    }

    const rows = await query(
      `SELECT c.* , u.nom, u.prenom
       FROM consultation c 
       JOIN dossier_medical_global d ON c.id_dossier = d.id_dossier
       JOIN utilisateur u ON c.id_utilisateur = u.id_utilisateur 
       WHERE d.id_patient = $1`,
      [id_patient]
    );

    if (!rows.rows.length) {
      return res.status(404).json({ 
        success: false,
        message: "Aucune consultation trouvée" 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: "Consultations trouvées",
      data: rows.rows 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message 
    });
  }
};

/**
 * @description Met à jour le statut de paiement d'un patient
 * @param {*} req 
 * @param {*} res 
 * @returns {Object} Réponse HTTP
 */
const updatePatientPaymentStatus = async (req, res) => {
  try {
    const { id_patient } = req.params;
    const { is_paid } = req.body;

    if (is_paid === undefined) {
      return res.status(400).json({
        success: false,
        message: "Le statut de paiement (is_paid) est requis"
      });
    }

    // Vérifier si le patient existe
    const patientExists = await query(
      `SELECT id_patient FROM patient WHERE id_patient = $1`,
      [id_patient]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient non trouvé"
      });
    }

    // Mettre à jour le statut de paiement
    const result = await query(
      `UPDATE patient SET is_paid = $1 WHERE id_patient = $2 RETURNING *`,
      [is_paid, id_patient]
    );

    return res.status(200).json({
      success: true,
      message: `Statut de paiement mis à jour avec succès (${is_paid ? 'Payé' : 'Non payé'})`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de paiement:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut de paiement",
      error: error.message
    });
  }
};

/**
 * @description Récupère tous les patients d'un hôpital
 * @param {*} req 
 * @param {*} res 
 * @returns {Object} Réponse HTTP avec la liste des patients
 */
const getAllPatients = async (req, res) => {
  try {
    const { id_hopital } = req.body;

    if (!id_hopital) {
      return res.status(400).json({
        success: false,
        message: "L'ID de l'hôpital est requis"
      });
    }

    // Récupérer tous les patients de l'hôpital
    const patients = await query(
      `SELECT * FROM patient WHERE id_hopital = $1 ORDER BY nom ASC`,
      [id_hopital]
    );

    return res.status(200).json({
      success: true,
      message: "Patients récupérés avec succès",
      data: patients.rows
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des patients:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des patients",
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
  getPersonnelById,
  loginpatient,
  getconsultationforpatient,
  updatePatientPaymentStatus,
  getAllPatients
};

require('dotenv').config();
const { query } = require('../../config/db');
const bcrypt = require('bcrypt');


const getdossier = async (req, res) => {
    try {
        const { rows } = await query('SELECT * FROM dossier_medical_global');
        res.json(rows);
    } catch (error) {
        res.status(400).json(error);
    }
}

const getAuthorisezeHopital = async (req, res) => {
    const { nom_hopital, nom_patient, date_naissance, nom_tuteur } = req.body;

    // Validation des champs requis
    if (!nom_hopital || !nom_patient || !date_naissance || !nom_tuteur) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }


    try {

        // 1. Récupérer l'hôpital
        const hopitalResult = await query(
            'SELECT id_hopital FROM hopital WHERE nom = $1', 
            [nom_hopital]
        );
        
        if (hopitalResult.rows.length === 0) {
            return res.status(404).json({ error: "Hôpital non trouvé" });
        }
        
        const hopital = hopitalResult.rows[0];

        // 2. Générer la clé d'accès à comparer
        const donneesClef = `${nom_patient}${date_naissance}${nom_tuteur}`.replace(/\s/g, '');
        
        // 3. Trouver le dossier médical avec comparaison de clé
        const dossierResult = await query(
            `SELECT d.* 
             FROM dossier_medical_global d
             JOIN patient p ON d.id_patient = p.id_patient
             WHERE p.nom = $1 
             AND p.date_naissance = $2
             AND p.nom_tuteur = $3`,
            [nom_patient, date_naissance, nom_tuteur]
        );

        if (dossierResult.rows.length === 0) {
            return res.status(404).json({ error: "Dossier médical non trouvé" });
        }

        const dossier = dossierResult.rows[0];

        // 4. Vérifier la clé d'accès
        const cleValide = await bcrypt.compare(donneesClef, dossier.cle_acces_dossier);
        
        if (!cleValide) {
            return res.status(403).json({ error: "Accès refusé: clé d'accès invalide" });
        }

        // 5. Enregistrer l'accès autorisé
        const accesResult = await query(
            `INSERT INTO acces_autorise_par_cle_patient(
                id_patient, 
                id_hopital_autorise, 
                date_autorisation, 
                id_dossier_autorise
             ) VALUES($1, $2, $3, $4) RETURNING *`,
            [dossier.id_patient, hopital.id_hopital, new Date(), dossier.id_dossier]
        );


        // 6. Récupérer les informations complètes à retourner
        const result = {
            hopital: {
                id: hopital.id_hopital,
                nom: nom_hopital
            },
            patient: {
                id: dossier.id_patient,
                nom: nom_patient
            },
            dossier: {
                id: dossier.id_dossier,
                date_creation: dossier.date_creation
            },
            autorisation: accesResult.rows[0]
        };

        return res.status(200).json(result);

    } catch (error) {
        console.error("Erreur:", error);
        
        if (error.code === '23505') { // Violation de contrainte unique
            return res.status(409).json({ 
                error: "Cet hôpital a déjà accès à ce dossier" 
            });
        }
        
        return res.status(500).json({ 
            error: "Erreur serveur",
            details: error.message 
        });
    } finally {
    }
};

const InsererPatientDossier = async (req, res) => {
    const { nom, prenom, date_naissance, nom_tuteur, id_hopital, adresse, donnees, donnee_dossier, code } = req.body;

    // Validation des champs obligatoires
    if (!nom || !prenom || !date_naissance || !nom_tuteur || !id_hopital || !adresse || !donnees || !code || !donnee_dossier) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    try {
        // Génération de la clé d'accès
        const donneesClefInitiale = `${nom}${date_naissance}${nom_tuteur}`.replace(/\s/g, '');
        const cle_acces_dossier = await bcrypt.hash(donneesClefInitiale, 10);

        // Insertion du patient
        const resultPatient = await query(
            'INSERT INTO patient(nom, prenom, date_naissance, nom_tuteur, adresse, donnees, code) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [nom, prenom, date_naissance, nom_tuteur, adresse, donnees, code]
        );

        if (resultPatient.rows.length === 0) {
            return res.status(500).json({ error: "Échec de l'insertion du patient" });
        }

        const id_patient = resultPatient.rows[0].id_patient;
        const maintenant = new Date();

        // Insertion du dossier médical
        const resultDossier = await query(
            'INSERT INTO dossier_medical_global(id_patient, id_hopital, donnees_medicales, date_creation, derniere_modification, cle_acces_dossier) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
            [id_patient, id_hopital, donnee_dossier, maintenant, maintenant, cle_acces_dossier]
        );

        // Retourner les deux résultats combinés
        return res.status(201).json({
            patient: resultPatient.rows[0],
            dossier: resultDossier.rows[0]
        });

    } catch (error) {
        console.error("Erreur SQL:", error);
        return res.status(500).json({
            error: "Erreur serveur",
            details: error.message
        });
    }
};


module.exports = {
    getdossier,
    getAuthorisezeHopital,
    InsererPatientDossier
}
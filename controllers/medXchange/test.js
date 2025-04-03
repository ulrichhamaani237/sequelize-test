require('dotenv').config();
const { query } = require('../../config/db');
const bcrypt = require('bcrypt');
const xlsx = require('xlsx');
const crypto = require('crypto');
const upload = require('../../uploads/uploadProfess');
const { envoyerNotificationUtilisateur } = require('../../controllers/medXchange/notification')
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { genererCleAccesUnifiee } = require('../../helpers/generateKey')



const getPatientAutorizeHopitale = async (req, res) => {

    try {
        const { id_hopital } = req.body

        const response = await query(`
        SELECT p.*, h.nom as nomhopitale from patient p
        INNER join acces_autorise_par_cle_patient a ON a.id_patient = p.id_patient
        INNER JOIN hopital h ON h.id_hopital = a.id_hopital_autorise
        WHERE h.id_hopital = $1
        `, [id_hopital])

        if (response.rows.length == 0) {
            return res.status(404).json({
                success: false,
                message: 'Aucun patient autorisé pour cette hopital'
            })
        }

        return res.status(200).json({
            success: true,
            donnees: response.rows
        })

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des patients autorisés pour cette hopital'
        });
    }

}

const getAllDataTables = async (req, res) => {
    const { table, id_hopital } = req.body;

    // Validation des entrées
    if (!table || !id_hopital) {
        return res.status(400).json({
            success: false,
            message: 'Le nom de la table et l\'ID de l\'hôpital sont requis'
        });
    }

    // Liste blanche des tables autorisées
    const allowedTables = ['patient', 'utilisateur'];
    if (!allowedTables.includes(table)) {
        return res.status(403).json({
            success: false,
            message: 'Accès non autorisé à cette table'
        });
    }

    try {
        // Utilisation de paramètres nommés pour plus de sécurité
        const sql = `SELECT * FROM ${table} WHERE id_hopital = $1`;
        const response = await query(sql, [id_hopital]);

        if (response.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Aucun enregistrement trouvé'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Enregistrements trouvés',
            count: response.rows.length,
            donnees: response.rows
        });

    } catch (error) {
        console.error('Erreur dans getAllTables:', error.message);



        return res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
};

const registerUtilisateur = async (req, res) => {
    const { nom, prenom, email, mot_de_passe, role, id_hopital, autre_donnees } = req.body;


    // Validation des champs       
    try {
        // Hachage du mot de passe
        const motDePasseHash = await bcrypt.hash(mot_de_passe, 10);

        // Génération du token initial
        // const token = jwt.sign({ id_utilisateur: null }, process.env.TOKEN_KEY, { expiresIn: '10d' });

        // Requête SQL corrigée (vérifiez que les noms de colonnes correspondent à votre schéma de base)
        const sql = `
            INSERT INTO utilisateur(
                nom, 
                prenom, 
                email, 
                mot_de_passe_hash,  
                role, 
                id_hopital, 
                autre_donnees
            ) VALUES($1, $2, $3, $4, $5, $6, $7) 
            RETURNING id_utilisateur, nom, email, role, token
        `;



        // Utilisation correcte de db.query (assurez-vous que db est bien importé/configuré)
        const { rows } = await query(sql, [
            nom,
            prenom,
            email,
            motDePasseHash,
            role,
            id_hopital,
            autre_donnees || null, // Gestion de la valeur NULL si autre_donnees est vide
        ]);

        if (rows.length === 0) {
            return res.status(500).json({ error: "Échec de l'insertion de l'utilisateur" });
        }

        const newUser = rows[0];

        // MAINTENANT générer le token valide
        const token = jwt.sign(
            {
                id_utilisateur: newUser.id_utilisateur,
                email: newUser.email,
                role: newUser.role
            },
            process.env.TOKEN_KEY,
            { expiresIn: '30d' }
        );

        // Mettre à jour en base
        await query(
            'UPDATE utilisateur SET token = $1 WHERE id_utilisateur = $2',
            [token, newUser.id_utilisateur]
        );

        // Renvoyer le BON token
        res.status(201).json({
            success: true,
            user: {
                ...newUser,
            },
            token: token
        });

    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);

        // Gestion spécifique des erreurs PostgreSQL
        if (error.code === '42703') { // Erreur de colonne inexistante
            return res.status(500).json({
                error: "Erreur de configuration de la base de données",
                details: "Une colonne spécifiée n'existe pas dans la table",
                success: false
            });
        } else if (error.code === '23505') { // Violation de contrainte unique (email déjà existant)
            return res.status(409).json({
                error: "cette Email existe deja",
                details: "Une colonne spécifiée n'existe pas dans la table",
                success: false
            });
        }

        res.status(500).json({
            error: "Erreur serveur",
            details: error.message,
            success: false
        });
    }
};

const refreshToken = async (req, res) => {
    const { token, id_user } = req.body

    try {
        if (!token || !id_user) {
            return res.status(400).json({ message: "information  requise" })
        }

        const sql = 'UPDATE utilisateur SET token =$1 WHERE id_utilisateur = $2'

        await query(sql, [token, id_user])

        return res.status(200).json({ message: "token modifie" })
    } catch (err) {
        return res.status(400).json({ error: err })
    }

}


const LoginUtilisateur = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Tous les champs sont requis" });
        }

        const sql = 'SELECT * FROM utilisateur WHERE email = $1';
        const { rows: users } = await query(sql, [email]);

        if (users.length === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        const user = users[0];
        const motDePasseValide = await bcrypt.compare(password, user.mot_de_passe_hash);

        if (!motDePasseValide) {
            return res.status(401).json({ message: "Mot de passe invalide!" });
        }

        let token = user.token;
        let tokenExpired = true;

        // Vérifier si le token existe et est encore valide
        if (token) {
            try {
                jwt.verify(token, process.env.TOKEN_KEY);
                tokenExpired = false;
            } catch (err) {
                if (err.name === 'TokenExpiredError') {
                    console.log("Token expiré, génération d'un nouveau token");
                } else {
                    console.log("Token invalide, génération d'un nouveau token");
                }
            }
        }

        // Générer un nouveau token si nécessaire
        if (!token || tokenExpired) {
            token = jwt.sign(
                {
                    id_utilisateur: user.id_utilisateur,
                    email: user.email,
                    role: user.role
                },
                process.env.TOKEN_KEY,
                { expiresIn: '10d' }
            );

            // Mettre à jour le token dans la BD
            await query(
                'UPDATE utilisateur SET token = $1 WHERE id_utilisateur = $2',
                [token, user.id_utilisateur]
            );
        }

        return res.status(200).json({
            id: user.id_utilisateur,
            username: user.nom,
            email: user.email,
            token: token,
            success: true,
            role: user.role,
            message: "Connexion réussie",
        });

    } catch (error) {
        console.error("Erreur lors de la connexion:", error);

        if (error.code === '23505') {
            return res.status(409).json({
                error: "Cet email est déjà utilisé"
            });
        } else if (error.code === '42703') {
            return res.status(500).json({
                error: "Erreur de configuration de la base de données",
                details: "Une colonne spécifiée n'existe pas dans la table"
            });
        }

        return res.status(500).json({
            error: "Erreur serveur",
            details: error.message
        });
    }
};

// Déconnexion
const logout = async (req, res) => {
    try {

        await query(
            'UPDATE utilisateur SET token = NULL WHERE id_utilisateur = $1',
            [req.user.id_utilisateur]
        );

        res.json({ message: "Déconnexion réussie" });
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

const getUserFromToken = async (token) => {

    try {
        const trimmedToken = token.trim();
        // on decode le token
        const decoded = jwt.verify(trimmedToken, process.env.TOKEN_KEY)
        console.log("decoded", decoded);

        // recuperation des donnee

        const resultat = await query('SELECT * FROM utilisateur WHERE id_utilisateur = $1', [decoded.id_utilisateur])
        if (resultat.rows.length === 0) {
            return { success: false, message: "Utilisateur non trouvé" }
        }
        const user = resultat.rows[0]
        return { success: true, user }

    } catch (error) {

        console.error('Token de verification invalide', error)
        return { success: false, message: 'token invalide' }
    }
}

const getUserDetail = async (req, res) => {
    //extration du token
    const token = req.headers.authorization?.split(' ')[1];
    console.log(token);

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token not provided' });
    }

    try {
        const response = await getUserFromToken(token)
        if (response.success) {
            return res.status(200).json({ success: true, user: response.user });
        } else {
            return res.status(401).json({ success: false, message: response.message });
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve user details' });
    }

}

const getdossier = async (req, res) => {
    const { id_hopitale } = req.body;
    try {

        if (!id_hopitale) {
            return res.status(400).json({
                success: false,
                message: "id_hopitale est requis"
            });
        }

        const respons = await query(`
            SELECT p.*, d.donnees_medicales FROM dossier_medical_global d
            JOIN patient p ON d.id_patient= p.id_patient
            JOIN hopital h ON h.id_hopital = d.id_hopital
            WHERE h.id_hopital =  $1
            `, [id_hopitale])

        if (respons.rows.length == 0) {
            return res.status(404).json({
                success: false,
                message: "Aucun dossier trouvé pour cet hôpital"
            });
        }

        return res.status(200).json({
            success: true,
            dossiers: respons.rows
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Erreur lors de la récupération des dossiers",
            details: error.message
        });
    }
}

const getAuthorisezeHopital = async (req, res) => {
    const { id_hopitale, nom_patient, nom_tuteur } = req.body;

    if (!id_hopitale || !nom_patient || !nom_tuteur) {
        return res.status(400).json({
            success: false,
            message: "Tous les champs sont requis (id_hopitale, nom_patient, nom_tuteur)"
        });
    }

    try {
        // 1. Vérification de l'hôpital
        const hopitalResult = await query(
            'SELECT id_hopital, nom FROM hopital WHERE id_hopital = $1',
            [id_hopitale]
        );

        if (hopitalResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Hôpital non trouvé"
            });
        }

        // 2. Recherche du patient
        const patientResult = await query(
            `SELECT p.id_patient, p.nom, p.prenom, p.date_naissance, p.nom_tuteur, 
                    d.id_dossier, d.cle_acces_dossier
             FROM patient p
             JOIN dossier_medical_global d ON p.id_patient = d.id_patient
             WHERE p.nom = $1 AND p.nom_tuteur = $2`,
            [nom_patient.trim(), nom_tuteur.trim()]
        );

        if (patientResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Aucun dossier médical trouvé pour ce patient/tuteur"
            });
        }

        const dossier = patientResult.rows[0];

        // 3. Vérification si l'accès existe déjà
        const existingAccess = await query(
            `SELECT id FROM acces_autorise_par_cle_patient 
             WHERE id_hopital_autorise = $1 AND id_patient = $2`,
            [id_hopitale, dossier.id_patient]
        );

        if (existingAccess.rows.length > 0) {
            // Mise à jour si accès existe déjà
            await query(
                `UPDATE acces_autorise_par_cle_patient
                 SET date_autorisation = $1
                 WHERE id_hopital_autorise = $2 AND id_patient = $3`,
                [new Date(), id_hopitale, dossier.id_patient]
            );

            return res.status(200).json({
                success: true,
                message: "Accès existant mis à jour",
                donnees: dossier
            });
        }

        // 4. Insertion si nouvel accès
        await query(
            `INSERT INTO acces_autorise_par_cle_patient(
                id_patient, 
                id_hopital_autorise, 
                date_autorisation, 
                id_dossier_autorise
             ) VALUES($1, $2, $3, $4)`,
            [dossier.id_patient, id_hopitale, new Date(), dossier.id_dossier]
        );

        return res.status(201).json({
            success: true,
            message: "Accès autorisé avec succès",
            donnees: dossier
        });

    } catch (error) {
        console.error("Erreur serveur:", error);
        return res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message
        });
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
        const donneesClefInitiale = nom + date_naissance + nom_tuteur;
        donneesClefInitiale.replace(/\s/g, '');
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



// Fonction pour générer un code unique (version améliorée)
const genererCodePatient = () => {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return code;
};

const createNewPatient = async (req, res) => {
    const { nom, prenom, date_naissance, nom_tuteur, id_hopital, adresse, donnees, sexe, taille, age } = req.body;

    // Validation des champs obligatoires
    if (!nom || !prenom || !date_naissance || !id_hopital) {
        return res.status(400).json({
            success: false,
            message: 'Nom, prénom, date de naissance et ID hopital sont obligatoires'
        });
    }

    try {
        // Génération du code patient unique
        let codeUnique;
        let codeExists;
        do {
            codeUnique = genererCodePatient();
            const checkCode = await query(
                'SELECT 1 FROM patient WHERE code = $1',
                [codeUnique]
            );
            codeExists = checkCode.rows.length > 0;
        } while (codeExists);

        // Insertion du patient
        const patientQuery = `
        INSERT INTO patient (
          nom, prenom, date_naissance, nom_tuteur, 
          id_hopital, adresse, donnees, code, sexe, taille, age
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

        const patientParams = [
            nom,
            prenom,
            new Date(date_naissance),
            nom_tuteur || null,
            id_hopital,
            adresse || null,
            donnees || null, // Valeur par défaut si donnees est undefined
            codeUnique,
            sexe || 'Non spécifié',
            taille ? parseFloat(taille) : null,
            age ? parseInt(age) : null
        ];

        const patientResult = await query(patientQuery, patientParams);

        // Vérification que le résultat contient des données
        if (!patientResult?.rows?.[0]) {
            throw new Error('Aucune donnée retournée après insertion');
        }

        res.status(201).json({
            success: true,
            message: 'Patient créé avec succès',
            patient: patientResult.rows[0] // Retourne toutes les colonnes demandées dans RETURNING
        });

    } catch (error) {
        console.error('Erreur création patient:', error);

        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du patient',
            error: error.message,
        });
    }
};

const importDossierMedicaleFromExcel = async (req, res) => {
    const { id_hopital } = req.body;

    if (!id_hopital) {
        return res.status(400).json({
            success: false,
            message: "L'ID de l'hôpital est requis"
        });
    }

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Aucun fichier sélectionné"
        });
    }

    const filePath = req.file.path;

    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);

        if (!jsonData || jsonData.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: "Le fichier est vide ou mal formaté" });
        }

        const patientFields = ['nom', 'prenom', 'date_naissance', 'nom_tuteur', 'adresse', 'sexe', 'taille', 'age'];
        const patientsData = [];
        const dossiersMedicauxData = [];

        function genererCodeUnique() {
            return Math.random().toString(36).substring(2, 10).toUpperCase();
        }

        const parseDate = (dateString) => {
            const parsedDate = new Date(dateString);
            return isNaN(parsedDate.getTime()) ? null : parsedDate;
        };

        for (const row of jsonData) {
            const codePatient = genererCodeUnique();

            const patient = {
                nom: row.nom || '',
                prenom: row.prenom || '',
                date_naissance: parseDate(row.date_naissance),
                nom_tuteur: row.nom_tuteur || null,
                id_hopital: id_hopital,
                adresse: row.adresse || null,
                code: codePatient,
                sexe: row.sexe || 'Non spécifié',
                taille: row.taille ? parseFloat(row.taille) : null,
                age: row.age ? parseInt(row.age) : null
            };
            const clefAccess = genererCleAccesUnifiee({
                nom: String(row.nom).trim(),
                date_naissance: parseDate(row.date_naissance),
                nom_tuteur: String(row.nom_tuteur).trim()
            })
            const dossierMedical = {
                id_hopital: id_hopital,
                date_creation: new Date(),
                cle_acces_dossier: clefAccess
            };

            for (const [key, value] of Object.entries(row)) {
                if (!patientFields.includes(key.toLowerCase()) && key !== 'id_hopital') {
                    dossierMedical[key] = value !== undefined ? String(value).trim() : null;
                }
            }

            patientsData.push(patient);
            dossiersMedicauxData.push(dossierMedical);
        }

        for (let i = 0; i < patientsData.length; i++) {
            const patient = patientsData[i];
            const dossierMedical = dossiersMedicauxData[i];

            // Modification ici: Utilisez directement query au lieu de createNewPatient
            const patientQuery = `
                INSERT INTO patient (
                    nom, prenom, date_naissance, nom_tuteur, 
                    id_hopital, adresse, code, sexe, taille, age
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `;

            const patientResult = await query(patientQuery, [
                patient.nom,
                patient.prenom,
                patient.date_naissance,
                patient.nom_tuteur,
                patient.id_hopital,
                patient.adresse,
                patient.code,
                patient.sexe,
                patient.taille,
                patient.age
            ]);

            if (!patientResult.rows[0]) {
                throw new Error("Échec de l'insertion du patient");
            }

            await query(
                `INSERT INTO dossier_medical_global (
                    id_patient, id_hopital, donnees_medicales, 
                    date_creation, derniere_modification, cle_acces_dossier
                ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [
                    patientResult.rows[0].id_patient,
                    id_hopital,
                    JSON.stringify(dossierMedical),
                    new Date(),
                    new Date(),
                    dossierMedical.cle_acces_dossier
                ]
            );
        }

        fs.unlinkSync(filePath);

        res.status(200).json({
            success: true,
            message: 'Import terminé avec succès',
            stats: { // Renommez 'imported' en 'stats' pour plus de clarté
                patients: patientsData.length,
                dossiers: dossiersMedicauxData.length
            }
        });

    } catch (error) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.status(500).json({
            success: false,
            message: "Échec de l'import",
            error: error.message,
        });
    }
};




const createPersonnelHopital = async (req, res) => {
    const { nom, prenom, email, mot_de_passe, role, id_hopital, autre_donnees } = req.body;

    // Validation des champs obligatoires
    if (!nom || !prenom || !email || !mot_de_passe || !id_hopital || !role || !autre_donnees) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    try {
        // Vérifier si l'hôpital existe
        const hopitalResult = await query(
            'SELECT * FROM hopital WHERE id_hopital = $1',
            [id_hopital]
        );

        if (hopitalResult.rows.length === 0) {
            return res.status(404).json({ error: "Hôpital non trouvé" });
        }

        // Générer le hash du mot de passe
        const motDePasseHash = await bcrypt.hash(mot_de_passe, 10);

        // Insertion du personnel
        const result = await query(
            'INSERT INTO utilisateur(nom, prenom, email, mot_de_passe, role, id_hopital,autre_donnees) VALUES($1, $2, $3, $4, $5) RETURNING *',
            [nom, prenom, email, motDePasseHash, role, id_hopital, autre_donnees]
        );

        if (result.rows.length === 0) {
            return res.status(500).json({ error: "Échec de l'insertion du personnel" });
        }

        return res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("Erreur SQL:", error);
        return res.status(500).json({
            error: "Erreur serveur",
            details: error.message
        });
    }

}

const createHopital = async (req, res) => {

    const { nom, adresse, type_hopitale, autres_donnees } = req.body;

    // Validation des champs obligatoires
    if (!nom || !adresse) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    try {
        // Insertion de l'hôpital
        const result = await query(
            'INSERT INTO hopital(nom, adresse,politique_gestion) VALUES($1, $2, $3) RETURNING *',
            [nom, adresse, autres_donnees]
        );

        if (result.rows.length === 0) {
            return res.status(500).json({
                hopital: '',
                success: false,
                message: 'erreur de creation de l hopital',
                IdHopitale: null
            });
        }

        return res.status(201).json({
            hopital: result.rows[0],
            success: true,
            message: 'hopital creer avec success',
            IdHopitale: result.rows[0].id_hopital
        });

    }
    catch (error) {
        console.error("Erreur SQL:", error);
        return res.status(500).json({
            error: "Erreur serveur",
            details: error.message
        });
    }
}

const AjouterTraitement = async (req, res) => {
    const { id_dossier, id_utilisateur, date_traitement, detail } = req.body;

    // Validation des champs obligatoires
    if (!id_dossier || id_utilisateur || !date_traitement || !detail) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    try {

        // Insertion du traitement
        const result = await query(
            'INSERT INTO traitement(id_dossier,id_utilisateur,date_traitement,detail) VALUES($1, $2, $3,$4) RETURNING *',
            [id_dossier, id_utilisateur, date_traitement, detail]
        );

        if (result.rows.length === 0) {
            return res.status(500).json({ error: "Échec de l'insertion du traitement" });
        }

        await envoyerNotificationUtilisateur(
            id_utilisateur,
            `Nouvelle consultation ajoutée au dossier ${id_dossier}`
        );
        return res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("Erreur SQL:", error);
        return res.status(500).json({
            error: "Erreur serveur",
            details: error.message
        });

    }
}

const AjouterConsultation = async (req, res) => {
    const { id_dossier, id_utilisateur, date_consultation, detail } = req.body;

    // Validation des champs obligatoires
    if (!id_dossier || id_utilisateur || !date_consultation || !detail) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    try {

        // Insertion du traitement
        const result = await query(
            'INSERT INTO consultation(id_dossier,id_utilisateur,date_consultation,detail) VALUES($1, $2, $3,$4) RETURNING *',
            [id_dossier, id_utilisateur, date_consultation, detail]
        );

        const resultatSelect = await query(
            'SELECT * FROM utilisateur WHERE id_utilisateur = $1',
            [id_utilisateur]
        )

        if (resultatSelect.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }



        if (result.rows.length === 0) {
            return res.status(500).json({ error: "Échec de l'insertion de la consultation" });
        }

        // Notification
        await client.query(
            `SELECT pg_notify(
                'nouvelle_consultation', 
                json_build_object(
                    'event', 'insert',
                    'table', 'consultation',
                    'data', $1,
                    'utilisateur', $2,
                )::text
            )`,
            [result.rows[0], resultatSelect.rows[0]]
        );

        return res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("Erreur SQL:", error);
        return res.status(500).json({
            error: "Erreur serveur",
            details: error.message
        });

    }
}

const AjouterDiagnostic = async (req, res) => {
    const { id_dossier, id_utilisateur, date_diagnostic, detail } = req.body;

    // Validation des champs obligatoires
    if (!id_dossier || id_utilisateur || !date_diagnostic || !detail) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    try {

        // Insertion du traitement
        const result = await query(
            'INSERT INTO diagnostic(id_dossier,id_utilisateur,date_diagnostic,detail) VALUES($1, $2, $3,$4) RETURNING *',
            [id_dossier, id_utilisateur, date_diagnostic, detail]
        );

        if (result.rows.length === 0) {
            return res.status(500).json({ error: "Échec de l'insertion du diagnostic" });
        }



        return res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("Erreur SQL:", error);
        return res.status(500).json({
            error: "Erreur serveur",
            details: error.message
        });

    }
}

const AjouterOrdonnance = async (req, res) => {
    const { id_dossier, id_utilisateur, date_ordonnance, detail } = req.body;

    // Validation des champs obligatoires
    if (!id_dossier || id_utilisateur || !date_ordonnance || !detail) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    try {

        // Insertion du traitement
        const result = await query(
            'INSERT INTO ordonnance(id_dossier,id_utilisateur,date_ordonnance,detail) VALUES($1, $2, $3,$4) RETURNING *',
            [id_dossier, id_utilisateur, date_ordonnance, detail]
        );

        if (result.rows.length === 0) {
            return res.status(500).json({ error: "Échec de l'insertion de l'ordonnance" });
        }

        return res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("Erreur SQL:", error);
        return res.status(500).json({
            error: "Erreur serveur",
            details: error.message
        });

    }
}

const AjouterResultat = async (req, res) => {
    const { id_dossier, id_utilisateur, date_resultat, detail } = req.body;

    // Validation des champs obligatoires
    if (!id_dossier || id_utilisateur || !date_resultat || !detail) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    try {

        // Insertion du traitement
        const result = await query(
            'INSERT INTO resultat(id_dossier,id_utilisateur,date_resultat,detail) VALUES($1, $2, $3,$4) RETURNING *',
            [id_dossier, id_utilisateur, date_resultat, detail]
        );

        if (result.rows.length === 0) {
            return res.status(500).json({ error: "Échec de l'insertion du resultat" });
        }

        return res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("Erreur SQL:", error);
        return res.status(500).json({
            error: "Erreur serveur",
            details: error.message
        });

    }
}

const AjouterHospitalisation = async (req, res) => {
    const { id_dossier, id_utilisateur, date_hospitalisation, detail } = req.body;

    // Validation des champs obligatoires
    if (!id_dossier || id_utilisateur || !date_hospitalisation || !detail) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    try {

        // Insertion du traitement
        const result = await query(
            'INSERT INTO hospitalisation(id_dossier,id_utilisateur,date_hospitalisation,detail) VALUES($1, $2, $3,$4) RETURNING *',
            [id_dossier, id_utilisateur, date_hospitalisation, detail]
        );

        if (result.rows.length === 0) {
            return res.status(500).json({ error: "Échec de l'insertion de l'hospitalisation" });
        }

        return res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("Erreur SQL:", error);
        return res.status(500).json({
            error: "Erreur serveur",
            details: error.message
        });

    }
}

const AjouterExamen = async (req, res) => {
    const { id_dossier, id_utilisateur, date_examen, detail } = req.body;

    // Validation des champs obligatoires
    if (!id_dossier || id_utilisateur || !date_examen || !detail) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    try {

        // Insertion du traitement
        const result = await query(
            'INSERT INTO examen(id_dossier,id_utilisateur,date_examen,detail) VALUES($1, $2, $3,$4) RETURNING *',
            [id_dossier, id_utilisateur, date_examen, detail]
        );

        if (result.rows.length === 0) {
            return res.status(500).json({ error: "Échec de l'insertion de l'examen" });
        }

        return res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("Erreur SQL:", error);
        return res.status(500).json({
            error: "Erreur serveur",
            details: error.message
        });

    }
}

const AjouterVaccin = async (req, res) => {
    const { id_dossier, id_utilisateur, date_vaccin, detail } = req.body;

    // Validation des champs obligatoires
    if (!id_dossier || id_utilisateur || !date_vaccin || !detail) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    try {

        // Insertion du traitement
        const result = await query(
            'INSERT INTO vaccin(id_dossier,id_utilisateur,date_vaccin,detail) VALUES($1, $2, $3,$4) RETURNING *',
            [id_dossier, id_utilisateur, date_vaccin, detail]
        );

        if (result.rows.length === 0) {
            return res.status(500).json({ error: "Échec de l'insertion du vaccin" });
        }

        return res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("Erreur SQL:", error);
        return res.status(500).json({
            error: "Erreur serveur",
            details: error.message
        });

    }
}

const AjouterAllergie = async (req, res) => {
    const { id_dossier, id_utilisateur, date_allergie, detail } = req.body;

    // Validation des champs obligatoires
    if (!id_dossier || id_utilisateur || !date_allergie || !detail) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    try {

        // Insertion du traitement
        const result = await query(
            'INSERT INTO allergie(id_dossier,id_utilisateur,date_allergie,detail) VALUES($1, $2, $3,$4) RETURNING *',
            [id_dossier, id_utilisateur, date_allergie, detail]
        );

        if (result.rows.length === 0) {
            return res.status(500).json({ error: "Échec de l'insertion de l'allergie" });
        }

        return res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("Erreur SQL:", error);
        return res.status(500).json({
            error: "Erreur serveur",
            details: error.message
        });

    }
}

const IsertHistorique_acces_dossier = async (req, res) => {
    const { id_dossier, id_utilisateur, date_acces, type_action } = req.body;

    // Validation des champs obligatoires
    if (!id_dossier || id_utilisateur || !date_acces || !type_action) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    try {

        // Insertion du traitement
        const result = await query(
            'INSERT INTO historique_acces_dossier(id_dossier,id_utilisateur,date_acces,type_action) VALUES($1, $2, $3,$4) RETURNING *',
            [id_dossier, id_utilisateur, date_acces, type_action]
        );

        if (result.rows.length === 0) {
            return res.status(500).json({ error: "Échec de l'insertion de l'historique d'accès" });
        }

        return res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("Erreur SQL:", error);
        return res.status(500).json({
            error: "Erreur serveur",
            details: error.message
        });

    }
}



const impoterProffessionnelToExcel = async (req, res) => {
    const { id_hopital } = req.body;

    if (!id_hopital) {
        return res.status(400).json({
            success: false,
            message: "L'ID de l'hôpital est requis"
        });
    }

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Aucun fichier sélectionné"
        });
    }

    const filepath = req.file.path;

    try {
        // Lecture du fichier Excel
        const workbook = xlsx.readFile(filepath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);

        if (!jsonData || jsonData.length === 0) {
            fs.unlinkSync(filepath);
            return res.status(400).json({
                success: false,
                message: 'Le fichier est vide ou mal formaté'
            });
        }

        const personnelfields = ["nom", "prenom", "email", "mot_de_passe_hash", "role", "adresse"];
        const personnelData = [];

        for (const row of jsonData) {
            // Validation des champs obligatoires
            if (!row.nom || !row.prenom || !row.email || !row.mot_de_passe_hash || !row.role) {
                throw new Error(`Tous les champs obligatoires doivent être remplis pour ${row.nom || ''} ${row.prenom || ''}`);
            }


            const password_hash = bcrypt.hashSync(row.mot_de_passe_hash, 10);
            const date_creation = new Date();

            // Construction de l'objet autre_donnees avec tous les champs non-standard
            const autre_donnees = {};
            for (const [key, value] of Object.entries(row)) {
                if (!personnelfields.includes(key.toLowerCase()) && key !== 'id_hopital') {
                    autre_donnees[key] = value !== undefined ? value : null;
                }
            }

            const personnel = {
                nom: row.nom,
                prenom: row.prenom,
                email: row.email,
                mot_de_passe_hash: password_hash,
                role: row.role,
                id_hopital: id_hopital,
                autre_donnees: JSON.stringify(autre_donnees), // Conversion en JSON
                adresse: row.adresse || null,
                created_at: date_creation,
                updated_at: date_creation
            };

            personnelData.push(personnel);
        }

        // Insertion des données
        const insertedIds = [];
        for (const personnel of personnelData) {
            try {
                const sql = `
                    INSERT INTO utilisateur(
                        nom, prenom, email,
                        mot_de_passe_hash, role, id_hopital, autre_donnees,
                        adresse, created_at, updated_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING id_utilisateur
                `;

                const result = await query(sql, [
                    personnel.nom,
                    personnel.prenom,
                    personnel.email,
                    personnel.mot_de_passe_hash,
                    personnel.role,
                    personnel.id_hopital,
                    personnel.autre_donnees,
                    personnel.adresse,
                    personnel.created_at,
                    personnel.updated_at
                ]);

                if (!result.rows[0]) {
                    throw new Error(`Échec de l'insertion pour ${personnel.nom} ${personnel.prenom}`);
                }

                const token = jwt.sign(
                    {
                        id_utilisateur: result.rows[0].id_utilisateur,
                        email: personnel.email,
                        role: personnel.role
                    },
                    process.env.TOKEN_KEY,
                    { expiresIn: '30d' }
                );

                await query(
                    `UPDATE utilisateur SET token = $1 
                    WHERE id_utilisateur = $2`,
                    [token, result.rows[0].id_utilisateur]
                );

                insertedIds.push(result.rows[0].id_utilisateur);
            } catch (error) {
                console.error(`Erreur lors de l'insertion de ${personnel.nom} ${personnel.prenom}:`, error);
                // Continue avec les autres enregistrements même en cas d'erreur
            }
        }

        if (insertedIds.length === 0) {
            throw new Error("Aucun enregistrement n'a pu être inséré");
        }

        fs.unlinkSync(filepath);

        res.status(200).json({
            success: true,
            message: 'Importation terminée avec succès',
            stats: {
                total: jsonData.length,
                inserted: insertedIds.length,
                failed: jsonData.length - insertedIds.length
            },
            insertedIds
        });

    } catch (error) {
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        console.error('Erreur lors de l\'importation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'importation',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
const getPatientsForshearch = async (req, res) => {
    try {
        const response = await query(`SELECT nom , prenom, date_naissance, nom_tuteur FROM patient`)

        if (response.rows.length < 0) {
            return res.status(404).json({
                success: false,
                message: 'Aucun patient trouvé'
            })

        }

        return res.status(200).json({
            success: true,
            message: 'Patients trouvés',
            donnees: response.rows
        })

    } catch (err) {
        console.error('Erreur lors de la récupération des patients:', err)
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des patients',
            error: err.message,
        })

    }
}
module.exports = {
    getdossier,
    getPatientsForshearch,
    getAuthorisezeHopital,
    InsererPatientDossier,
    importDossierMedicaleFromExcel,
    createPersonnelHopital,
    createHopital,
    AjouterTraitement,
    AjouterConsultation,
    AjouterDiagnostic,
    AjouterOrdonnance,
    AjouterResultat,
    AjouterHospitalisation,
    AjouterExamen,
    impoterProffessionnelToExcel,
    registerUtilisateur,
    LoginUtilisateur,
    logout,
    getUserDetail,
    refreshToken,
    createNewPatient,
    getAllDataTables,
    getPatientAutorizeHopitale
}
require('dotenv').config();
const { query } = require('../../config/db');
const bcrypt = require('bcrypt');
const xlsx = require('xlsx');
const upload = require('../../uploads/uploadProfess');
const { envoyerNotificationUtilisateur } = require('../../controllers/medXchange/notification')
const jwt = require('jsonwebtoken');


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
                token: token 
            },
            token: token         });

    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);

        // Gestion spécifique des erreurs PostgreSQL
        if (error.code === '42703') { // Erreur de colonne inexistante
            return res.status(500).json({
                error: "Erreur de configuration de la base de données",
                details: "Une colonne spécifiée n'existe pas dans la table",
                success: false
            });
        } else if (error.code === '23505'){ // Violation de contrainte unique (email déjà existant)
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

const refreshToken = async (req, res) =>{
    const {token, id_user} = req.body
  
    try {
        if (!token || !id_user) {
            return res.status(400).json({message: "information  requise"})
        }
    
        const sql = 'UPDATE utilisateur SET token =$1 WHERE id_utilisateur = $2'
    
       await query(sql,[token,id_user])
      
       return res.status(200).json({message: "token modifie"})
   } catch (err) {
    return res.status(400).json({error: err})
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
        const donneesClef = nom_patient + date_naissance + nom_tuteur;
        const donneesClefInitiale = donneesClef.replace(/\s/g, '');
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
        const cleValide = await bcrypt.compare(donneesClefInitiale, dossier.cle_acces_dossier);
        if (cleValide) {
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

const importDossierMedicaleFromExcel = async (req, res) => {

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
       
    }

    console.log('Fichier importé avec succès');
    res.status(200).json({ message: 'Fichier importé avec succès', data: jsonData });
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
            await createPersonnelHopital(row);
        }

        console.log('Fichier importé avec succès');
        res.status(200).json({ message: 'Fichier importé avec succès', data: jsonData });
    } catch (error) {
        console.error('Erreur lors de l\'importation du fichier:', error);
        res.status(500).json({ message: error.message });
    }
}


module.exports = {
    getdossier,
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
    refreshToken
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MedicalConsensus {
    uint public quorumTechnique = 2;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    struct BlocValidation {
        uint blocId;
        address[] validateurs;
        bool approuve;
    }

    struct AccesAutorise {
        address professionnel;
        uint expiration;
    }

    struct Paiement {
        address patient;
        bool paye;
    }

    mapping(uint => BlocValidation) public validations;
    mapping(address => AccesAutorise) public accesTemporaire;
    mapping(uint => Paiement) public paiements;
    mapping(uint => bool) public donneesValideFHIR;
    mapping(uint => string) public hashConsultations;


    event BlocValide(uint blocId);
    event AccesAutoriseEvent(address indexed patient, address indexed professionnel);
    event PaiementValide(uint idConsultation);
    event FormatFHIRValide(uint idConsultation);

    // Nouveaux événements pour audit
    event ConsultationModifiee(uint indexed idConsultation, string ancienHash, string nouveauHash, string motif);
    event ConsultationSupprimee(uint indexed idConsultation, string raison);
    event ConsultationAjoutee(uint idConsultation, string hashConsultation);


    function voteTechnique(uint blocId) public {
        BlocValidation storage v = validations[blocId];
        require(!v.approuve, "Bloc deja approuve");

        for (uint i = 0; i < v.validateurs.length; i++) {
            require(v.validateurs[i] != msg.sender, "Deja vote");
        }

        v.validateurs.push(msg.sender);

        if (v.validateurs.length >= quorumTechnique) {
            v.approuve = true;
            emit BlocValide(blocId);
        }
    }

    function autoriserAcces(address professionnel, uint dureeMinutes) public {
        accesTemporaire[msg.sender] = AccesAutorise(professionnel, block.timestamp + dureeMinutes * 1 minutes);
        emit AccesAutoriseEvent(msg.sender, professionnel);
    }

    function verifierAcces(address patient, address professionnel) public view returns (bool) {
        AccesAutorise memory a = accesTemporaire[patient];
        return (a.professionnel == professionnel && block.timestamp <= a.expiration);
    }

    function marquerPaiement(uint idConsultation) public {
        paiements[idConsultation] = Paiement(msg.sender, true);
        emit PaiementValide(idConsultation);
    }

    function estPaiementValide(uint idConsultation) public view returns (bool) {
        return paiements[idConsultation].paye;
    }

    function validerFormatFHIR(uint idConsultation, bool estValide) public {
        donneesValideFHIR[idConsultation] = estValide;
        if (estValide) {
            emit FormatFHIRValide(idConsultation);
        }
    }

    function estDonneeFHIRValide(uint idConsultation) public view returns (bool) {
        return donneesValideFHIR[idConsultation];
    }

    // === Événement pour modification ===
    function enregistrerModification(uint idConsultation, string memory ancienHash, string memory nouveauHash, string memory motif) public {
        emit ConsultationModifiee(idConsultation, ancienHash, nouveauHash, motif);
    }

    // === Événement pour suppression ===
    function enregistrerSuppression(uint idConsultation, string memory raison) public {
        emit ConsultationSupprimee(idConsultation, raison);
    }

    function ajouterConsultation(uint idConsultation, string memory hashConsultation) public {
        require(bytes(hashConsultations[idConsultation]).length == 0, "Deja ajoutee");
        hashConsultations[idConsultation] = hashConsultation;
        emit ConsultationAjoutee(idConsultation, hashConsultation); // visible dans Ganache
    }

    function traiterConsultationComplete(
        uint idConsultation,
        string memory hashConsultation,
        address patient,
        address professionnel,
        uint blocId
    ) public {
        // 1. Vérifie que le professionnel est autorisé
        AccesAutorise memory a = accesTemporaire[patient];
        require(a.professionnel == professionnel && block.timestamp <= a.expiration, "Acces non autorise");
    
        // 2. Marque le paiement comme valide
        paiements[idConsultation] = Paiement(msg.sender, true);
        emit PaiementValide(idConsultation);
    
        // 3. Enregistre la consultation (si pas encore faite)
        require(bytes(hashConsultations[idConsultation]).length == 0, "Consultation deja ajoutee");
        hashConsultations[idConsultation] = hashConsultation;
        emit ConsultationAjoutee(idConsultation, hashConsultation);
    
        // 4. Vote pour valider techniquement le bloc
        BlocValidation storage v = validations[blocId];
        for (uint i = 0; i < v.validateurs.length; i++) {
            require(v.validateurs[i] != msg.sender, "Deja vote");
        }
        v.validateurs.push(msg.sender);
    
        if (v.validateurs.length >= quorumTechnique) {
            v.approuve = true;
            emit BlocValide(blocId);
        }
    }
    

}

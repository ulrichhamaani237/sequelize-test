// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MedicalConsensus {
    uint public quorumTechnique = 2; // nombre de nœuds nécessaires pour valider un bloc
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

    mapping(uint => BlocValidation) public validations; // blocId => validation
    mapping(address => AccesAutorise) public accesTemporaire; // patient => autorisation
    mapping(uint => Paiement) public paiements; // idConsultation => Paiement
    mapping(uint => bool) public donneesValideFHIR; // idConsultation => validité FHIR

    event BlocValide(uint blocId);
    event AccesAutoriseEvent(address patient, address professionnel);
    event PaiementValide(uint idConsultation);
    event FormatFHIRValide(uint idConsultation);

    // ✅ 1. Validation technique par les noeuds
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

    // ✅ 2. Autorisation d'accès par le patient
    function autoriserAcces(address professionnel, uint dureeMinutes) public {
        accesTemporaire[msg.sender] = AccesAutorise(professionnel, block.timestamp + dureeMinutes * 1 minutes);
        emit AccesAutoriseEvent(msg.sender, professionnel);
    }

    function verifierAcces(address patient, address professionnel) public view returns (bool) {
        AccesAutorise memory a = accesTemporaire[patient];
        return (a.professionnel == professionnel && block.timestamp <= a.expiration);
    }

    // ✅ 3. Paiement préalable (booléen uniquement)
    function marquerPaiement(uint idConsultation) public {
        paiements[idConsultation] = Paiement(msg.sender, true);
        emit PaiementValide(idConsultation);
    }

    function estPaiementValide(uint idConsultation) public view returns (bool) {
        return paiements[idConsultation].paye;
    }

    // ✅ 4. Validation de format FHIR
    function validerFormatFHIR(uint idConsultation, bool estValide) public {
        donneesValideFHIR[idConsultation] = estValide;
        if (estValide) {
            emit FormatFHIRValide(idConsultation);
        }
    }

    function estDonneeFHIRValide(uint idConsultation) public view returns (bool) {
        return donneesValideFHIR[idConsultation];
    }
}

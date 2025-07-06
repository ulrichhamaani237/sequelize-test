// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MedicalConsensus {
    uint public quorumTechnique = 2;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    struct BlocValidation {
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

    event BlocValide(uint indexed blocId);
    event AccesAutoriseEvent(address indexed patient, address indexed professionnel);
    event PaiementValide(uint indexed idConsultation);
    event FormatFHIRValide(uint indexed idConsultation);

    // ✅ 1. Validation technique
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

    // ✅ 2. Autorisation d'accès
    function autoriserAcces(address professionnel, uint dureeMinutes) public {
        accesTemporaire[msg.sender] = AccesAutorise(professionnel, block.timestamp + dureeMinutes * 1 minutes);
        emit AccesAutoriseEvent(msg.sender, professionnel);
    }

    function verifierAcces(address patient, address professionnel) public view returns (bool) {
        AccesAutorise memory a = accesTemporaire[patient];
        return (a.professionnel == professionnel && block.timestamp <= a.expiration);
    }

    // ✅ 3. Paiement
    function marquerPaiement(uint idConsultation) public {
        paiements[idConsultation] = Paiement(msg.sender, true);
        emit PaiementValide(idConsultation);
    }

    function estPaiementValide(uint idConsultation) public view returns (bool) {
        return paiements[idConsultation].paye;
    }

    // ✅ 4. Validation FHIR
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

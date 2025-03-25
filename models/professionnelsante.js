'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProfessionnelSante extends Model {
    static associate(models) {
      // define associations here (ex: avec les patients, rdv, documents, etc.)
    }
  }
  ProfessionnelSante.init({
    nom: DataTypes.STRING,
    email: DataTypes.STRING,
    passeword: DataTypes.STRING,
    telephone: DataTypes.STRING,
    adresse: DataTypes.STRING,
    code: DataTypes.STRING,
    specialite: DataTypes.STRING,
    statut: DataTypes.ENUM('ACTIF', 'SUSPENDU', 'EN_ATTENTE'),
    role: DataTypes.ENUM('MEDECIN', 'INFIRMIER', 'ADMIN', 'SECRETAIRE'),
    permissions: DataTypes.JSON,
    dernierAcces: DataTypes.DATE,
    clePublique: DataTypes.TEXT,
    certificatNumerique: DataTypes.TEXT,
    photoProfil: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'ProfessionnelSante',
    tableName: 'professionnelsantes'
  });

  return ProfessionnelSante;
};

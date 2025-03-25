'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Patient extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Définir les associations ici (si nécessaire)
      // Exemple : Patient.hasMany(models.Consultation, { foreignKey: 'patientId' });
    }
  }
  Patient.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      nom: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      prenom: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dateDeNaissance: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sexe: {
        type: DataTypes.ENUM('M', 'F', 'Autre'),
        allowNull: false,
      },
      adresse: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ville: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      telephone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true, // Optionnel
      },
      groupeSanguin: {
        type: DataTypes.STRING,
        allowNull: true, // Optionnel
      },
      statut: {
        type: DataTypes.ENUM('Actif', 'Inactif', 'Décédé'),
        allowNull: false,
        defaultValue: 'Actif',
      },
      photo: {
        type: DataTypes.STRING,
        allowNull: true, // Optionnel
      },
      profession: {
        type: DataTypes.STRING,
        allowNull: true, // Optionnel
      },
      contactUrgent: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      contactUrgenceNom: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Patient',
      tableName: 'Patients', // Nom de la table dans la base de données
    }
  );
  return Patient;
};
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Patients', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nom: {
        type: Sequelize.STRING,
        allowNull: false
      },
      prenom: {
        type: Sequelize.STRING,
        allowNull: false
      },
      dateDeNaissance: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      sexe: {
        type: Sequelize.ENUM('M', 'F', 'Autre'),
        allowNull: false
      },
      adresse: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ville: {
        type: Sequelize.STRING,
        allowNull: false
      },
      telephone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true // Optionnel
      },
      groupeSanguin: {
        type: Sequelize.STRING,
        allowNull: true // Optionnel
      },
      statut: {
        type: Sequelize.ENUM('Actif', 'Inactif', 'Décédé'),
        allowNull: false,
        defaultValue: 'Actif'
      },
      photo: {
        type: Sequelize.STRING,
        allowNull: true // Optionnel
      },
      profession: {
        type: Sequelize.STRING,
        allowNull: true // Optionnel
      },
      contactUrgent: Sequelize.STRING,
      contactUrgenceNom: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Patients');
  }
};
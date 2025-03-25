'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProfessionnelSantes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nom: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING,
        unique: true
      },
      passeword: {
        type: Sequelize.STRING,
        allowNull: false
      },
      telephone: {
        type: Sequelize.STRING
      },
      adresse: {
        type: Sequelize.STRING
      },
      specialite: {
        type: Sequelize.STRING
      },
      statut: {
        type: Sequelize.ENUM('Actif', 'Suspendi', 'En_attente')
      },
      code: {
        type: Sequelize.STRING,
        unique: true
      },
      role: {
        type: Sequelize.ENUM('MEDECIN', 'INFIRMIER', 'ADMIN', 'SECRETAIRE')
      }, 
      permissions: {
        type: Sequelize.JSON // tu peux stocker une liste comme ['READ', 'WRITE']
      },
      dernierAcces: {
        type: Sequelize.DATE
      },
       clePublique: {
        type: Sequelize.TEXT
      },
      certificatNumerique: {
        type: Sequelize.TEXT
      },
       photoProfil: {
        type: Sequelize.STRING // URL
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
    await queryInterface.dropTable('ProfessionnelSantes');
  }
};
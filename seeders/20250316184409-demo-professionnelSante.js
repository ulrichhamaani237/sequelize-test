'use strict';
const { faker } = require('@faker-js/faker');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const professionnelsSante = [];

    for (let i = 0; i < 50; i++) {
      const nom = faker.person.lastName();
      const email = faker.internet.email({ lastName: nom });
      const code = faker.string.alphanumeric(8);
      const passeword = faker.internet.password({ length: 12 });
      const telephone = faker.phone.number('+33 6 ## ## ## ##');
      const adresse = faker.location.streetAddress();
      const specialite = faker.helpers.arrayElement([
        'Cardiologue', 'Généraliste', 'Pédiatre', 'Chirurgien', 'Neurologue', 'Dermatologue'
      ]);
      const statut = faker.helpers.arrayElement(['Actif', 'Inactif', 'Suspendu']);
      const role = faker.helpers.arrayElement(['MEDECIN', 'INFIRMIER', 'ADMIN']);
      const permissions = JSON.stringify([
        'CONSULTER_DOSSIERS',
        ...(role === 'ADMIN' ? ['GERER_UTILISATEURS', 'SUPPRIMER_DOSSIERS'] : [])
      ]);
      const dernierAcces = faker.date.recent();
      const clePublique = faker.string.uuid();
      const certificatNumerique = faker.string.uuid();
      const photoProfil = faker.image.avatar();

      professionnelsSante.push({
        nom,
        email,
        code,
        passeword,
        telephone,
        adresse,
        specialite,
        statut,
        role,
        permissions,
        dernierAcces,
        clePublique,
        certificatNumerique,
        photoProfil,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('ProfessionnelSantes', professionnelsSante, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ProfessionnelSantes', null, {});
  }
};

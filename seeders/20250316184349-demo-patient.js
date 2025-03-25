'use strict';
const { faker } = require('@faker-js/faker');

module.exports = {
  async up(queryInterface, Sequelize) {
    const patients = [];

    for (let i = 0; i < 50; i++) {
      const nom = faker.person.lastName();
      const prenom = faker.person.firstName();
      const dateDeNaissance = faker.date.birthdate({ min: 20, max: 80, mode: 'age' });
      const age = new Date().getFullYear() - dateDeNaissance.getFullYear();
      const sexe = faker.helpers.arrayElement(['Homme', 'Femme']);
      const adresse = faker.location.streetAddress();
      const ville = faker.location.city();
      const telephone = faker.phone.number('+33 6 ## ## ## ##');
      const email = faker.internet.email({ firstName: prenom, lastName: nom });
      const groupeSanguin = faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
      const statut = faker.helpers.arrayElement(['Actif', 'Inactif', 'Décédé']);
      const photo = faker.image.avatar();
      const profession = faker.person.jobTitle();
      const contactUrgent = faker.phone.number('+33 7 ## ## ## ##');
      const contactUrgenceNom = faker.person.fullName();

      patients.push({
        nom,
        prenom,
        dateDeNaissance,
        age,
        sexe,
        adresse,
        ville,
        telephone,
        email,
        groupeSanguin,
        statut,
        photo,
        profession,
        contactUrgent,
        contactUrgenceNom,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    //await queryInterface.bulkInsert('Patients', patients, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Patients', null, {});
  }
};

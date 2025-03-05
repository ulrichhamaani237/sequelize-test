'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
   await queryInterface.bulkInsert('Users', [{
     name: 'John Doe',
     email: 'john.doe@example.com',
     password: 'password123',
     createdAt: new Date(),
     updatedAt: new Date()
   },
   {
     name: 'Jane Doe',
     email: 'jane.doe@example.com',
     password: 'password456',
     createdAt: new Date(),
     updatedAt: new Date()
   }
  
  ])
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};

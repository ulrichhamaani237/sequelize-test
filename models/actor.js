'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Actor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    Actor.belongsToMany(models.Movie, {through: 'MovieActor'})
    }
  }
  Actor.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Actor',
    tableName: 'Actors',
  });
  return Actor;
};
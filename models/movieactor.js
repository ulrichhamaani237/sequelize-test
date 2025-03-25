'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MovieActor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  MovieActor.init({
    MovieId: { type: DataTypes.INTEGER, 
      references:{
        model: 'Movie',
        key: 'id'
      }
     },
    ActorId: { type: DataTypes.INTEGER, 
      references:{
        model: 'Actor',
        key: 'id'
      }
     }
  }, {
    sequelize,
    modelName: 'MovieActor',
    tableName: 'movieactors'
  });
  return MovieActor;
};
const {Movie, Actor, MovieActor} =require('../models')

const getActors = async (req, res) =>{
   
    try {
    const actors =  await Actor.findAll();
   res.status(200).json(actors)       
    } catch (err) {
        res.status(500).json({message:"Erreur de recuperation des acteur"})
    } 
    
}

module.exports = {
    getActors
}
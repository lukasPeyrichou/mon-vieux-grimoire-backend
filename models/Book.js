// Modèle Mongoose d'un livre, conforme aux spécifications de l'API
const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
  // _id MongoDB de l'utilisateur qui a créé le livre (sert à vérifier le propriétaire)
  userId: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  imageUrl: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  // Une entrée par utilisateur ayant noté le livre (note de 0 à 5)
  ratings: [
    {
      userId: { type: String, required: true },
      grade: { type: Number, required: true, min: 0, max: 5 },
    },
  ],
  averageRating: { type: Number, default: 0 },
}, {
  // Si deux requêtes modifient le même livre en même temps (deux notes envoyées d'un coup),
  // la seconde sauvegarde échoue au lieu d'écraser la première : pas de double note possible
  optimisticConcurrency: true,
});

module.exports = mongoose.model('Book', bookSchema);

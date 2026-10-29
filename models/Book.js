// Modèle Livre
const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
  // _id du créateur
  userId: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  imageUrl: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  // Une note (0 à 5) par utilisateur
  ratings: [
    {
      userId: { type: String, required: true },
      grade: { type: Number, required: true, min: 0, max: 5 },
    },
  ],
  averageRating: { type: Number, default: 0 },
}, {
  // Sauvegardes simultanées : la seconde échoue au lieu d'écraser (pas de double note)
  optimisticConcurrency: true,
});

module.exports = mongoose.model('Book', bookSchema);

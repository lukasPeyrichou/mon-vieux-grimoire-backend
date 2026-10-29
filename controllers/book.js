// Contrôleur des livres
const Book = require('../models/Book');

// GET /api/books : tous les livres
exports.getAllBooks = (req, res) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

// GET /api/books/:id : un seul livre
exports.getOneBook = (req, res) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: 'Livre introuvable !' });
      }
      res.status(200).json(book);
    })
    // Un id mal formé produit une CastError de Mongoose
    .catch((error) => res.status(400).json({ error }));
};

// GET /api/books/bestrating : les 3 livres les mieux notés
exports.getBestRating = (req, res) => {
  // Tri décroissant sur la note moyenne, puis on ne garde que les 3 premiers
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

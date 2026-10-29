// Contrôleur des livres
const fs = require('fs');
const path = require('path');
const Book = require('../models/Book');

// Supprime une image de images/ (absente = pas d'erreur) ; path.basename empêche
// de sortir du dossier (« ../.env »)
const removeImage = (filename) => {
  fs.unlink(path.join(__dirname, '..', 'images', path.basename(filename)), () => {});
};

// Nom du fichier depuis l'imageUrl
const imageFilename = (imageUrl) => imageUrl.split('/images/')[1];

// POST /api/books : livre (texte JSON) + image
exports.createBook = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Une image est requise !' });
  }
  let bookObject;
  try {
    // Avec multer, le livre arrive en texte dans req.body.book
    bookObject = JSON.parse(req.body.book);
  } catch (error) {
    removeImage(req.file.filename);
    return res.status(400).json({ error: error.message });
  }
  // Le userId vient du token, jamais du client
  delete bookObject._id;
  delete bookObject.userId;

  // Note initiale gardée si entre 1 et 5, sinon aucune note et moyenne à 0
  const grade = Number(bookObject.ratings?.[0]?.grade);
  const hasGrade = grade >= 1 && grade <= 5;

  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    ratings: hasGrade ? [{ userId: req.auth.userId, grade }] : [],
    averageRating: hasGrade ? grade : 0,
  });

  book
    .save()
    .then(() => res.status(201).json({ message: 'Livre enregistré !' }))
    .catch((error) => {
      // Livre refusé : on supprime l'image
      removeImage(req.file.filename);
      res.status(400).json({ error });
    });
};

// PUT /api/books/:id : avec ou sans nouvelle image
exports.modifyBook = (req, res) => {
  let received;
  try {
    // Avec image : texte dans req.body.book ; sans : req.body (undefined sans corps en Express 5)
    received = req.file ? JSON.parse(req.body.book) : req.body || {};
  } catch (error) {
    removeImage(req.file.filename);
    return res.status(400).json({ error: error.message });
  }

  // Liste blanche : seuls ces champs sont modifiables
  const bookObject = {};
  ['title', 'author', 'year', 'genre'].forEach((field) => {
    if (received[field] !== undefined) {
      bookObject[field] = received[field];
    }
  });
  // imageUrl fixée par le serveur, seulement avec un nouveau fichier
  if (req.file) {
    bookObject.imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
  }

  // En cas d'échec, supprime la nouvelle image
  const cancelUpload = () => req.file && removeImage(req.file.filename);

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        cancelUpload();
        return res.status(404).json({ error: 'Livre introuvable !' });
      }
      // Réservé au créateur
      if (book.userId !== req.auth.userId) {
        cancelUpload();
        return res.status(403).json({ message: '403: unauthorized request' });
      }
      // runValidators : applique les règles du modèle
      return Book.updateOne({ _id: req.params.id }, { $set: bookObject }, { runValidators: true }).then(() => {
        // Supprime l'ancienne image
        if (req.file) {
          removeImage(imageFilename(book.imageUrl));
        }
        res.status(200).json({ message: 'Livre modifié !' });
      });
    })
    .catch((error) => {
      cancelUpload();
      res.status(400).json({ error });
    });
};

// POST /api/books/:id/rating : ajoute la note et recalcule la moyenne
exports.rateBook = (req, res) => {
  // userId du token : impossible de noter au nom d'un autre
  const { userId } = req.auth;
  const grade = req.body?.rating;

  if (typeof grade !== 'number' || grade < 0 || grade > 5) {
    return res.status(400).json({ error: 'La note doit être un nombre compris entre 0 et 5 !' });
  }

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: 'Livre introuvable !' });
      }
      // Une seule note par utilisateur, non modifiable
      if (book.ratings.some((rating) => rating.userId === userId)) {
        return res.status(400).json({ error: 'Vous avez déjà noté ce livre !' });
      }

      book.ratings.push({ userId, grade });
      const total = book.ratings.reduce((sum, rating) => sum + rating.grade, 0);
      // Arrondie à une décimale
      book.averageRating = Math.round((total / book.ratings.length) * 10) / 10;

      // Renvoie le livre mis à jour
      return book.save().then((savedBook) => res.status(200).json(savedBook));
    })
    .catch((error) => res.status(400).json({ error }));
};

// DELETE /api/books/:id : livre et image
exports.deleteBook = (req, res) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: 'Livre introuvable !' });
      }
      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: '403: unauthorized request' });
      }
      return Book.deleteOne({ _id: req.params.id }).then(() => {
        removeImage(imageFilename(book.imageUrl));
        res.status(200).json({ message: 'Livre supprimé !' });
      });
    })
    .catch((error) => res.status(400).json({ error }));
};

// GET /api/books : tous les livres
exports.getAllBooks = (req, res) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

// GET /api/books/:id
exports.getOneBook = (req, res) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: 'Livre introuvable !' });
      }
      res.status(200).json(book);
    })
    // Id mal formé (CastError)
    .catch((error) => res.status(400).json({ error }));
};

// GET /api/books/bestrating : les 3 livres les mieux notés
exports.getBestRating = (req, res) => {
  // Tri par moyenne décroissante
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

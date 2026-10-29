// Contrôleur des livres
const fs = require('fs');
const path = require('path');
const Book = require('../models/Book');

// Supprime une image du dossier images/ ; une image déjà absente n'est pas une erreur
const removeImage = (filename) => {
  fs.unlink(path.join(__dirname, '..', 'images', filename), () => {});
};

// Retrouve le nom du fichier à partir de l'adresse complète enregistrée en base
const imageFilename = (imageUrl) => imageUrl.split('/images/')[1];

// POST /api/books : crée un livre à partir du formulaire (texte JSON + image)
exports.createBook = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Une image est requise !' });
  }
  let bookObject;
  try {
    // Avec multer, le livre arrive sous forme de texte JSON dans req.body.book
    bookObject = JSON.parse(req.body.book);
  } catch (error) {
    removeImage(req.file.filename);
    return res.status(400).json({ error: error.message });
  }
  // On ne fait jamais confiance au userId envoyé par le client : on prend celui du token
  delete bookObject._id;
  delete bookObject.userId;

  // Le formulaire de création propose de noter le livre : on garde cette note si elle est
  // entre 1 et 5 étoiles. Sinon (aucune étoile), notes vides et moyenne à 0 comme le
  // demandent les spécifications.
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
      // Livre refusé (champ manquant...) : l'image déjà enregistrée ne sert plus à rien
      removeImage(req.file.filename);
      res.status(400).json({ error });
    });
};

// PUT /api/books/:id : modifie un livre, avec ou sans nouvelle image
exports.modifyBook = (req, res) => {
  let bookObject;
  try {
    // Avec une nouvelle image, le livre est en texte dans req.body.book ; sans image, directement dans req.body
    bookObject = req.file
      ? {
          ...JSON.parse(req.body.book),
          imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        }
      : { ...req.body };
  } catch (error) {
    removeImage(req.file.filename);
    return res.status(400).json({ error: error.message });
  }
  // Champs que la modification ne doit pas pouvoir changer : propriétaire et notes
  delete bookObject._id;
  delete bookObject.userId;
  delete bookObject.ratings;
  delete bookObject.averageRating;

  // En cas d'échec, la nouvelle image envoyée ne doit pas rester orpheline sur le disque
  const cancelUpload = () => req.file && removeImage(req.file.filename);

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        cancelUpload();
        return res.status(404).json({ error: 'Livre introuvable !' });
      }
      // Seul le créateur du livre peut le modifier
      if (book.userId !== req.auth.userId) {
        cancelUpload();
        return res.status(403).json({ message: '403: unauthorized request' });
      }
      // runValidators : les règles du modèle (champs requis, types) s'appliquent aussi aux modifications
      return Book.updateOne({ _id: req.params.id }, { ...bookObject }, { runValidators: true }).then(() => {
        // La nouvelle image remplace l'ancienne, qu'on supprime du disque
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

// DELETE /api/books/:id : supprime un livre et son image
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

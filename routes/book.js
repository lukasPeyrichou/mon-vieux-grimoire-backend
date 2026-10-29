// Routes des livres, montées sur /api/books dans app.js
const express = require('express');
const bookCtrl = require('../controllers/book');

const router = express.Router();

// Lecture publique : pas besoin d'être connecté (spécifications de l'API)
router.get('/', bookCtrl.getAllBooks);
// /bestrating doit être déclarée avant /:id, sinon Express prendrait « bestrating » pour un id
router.get('/bestrating', bookCtrl.getBestRating);
router.get('/:id', bookCtrl.getOneBook);

module.exports = router;

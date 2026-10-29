// Routes des livres, montées sur /api/books dans app.js
const express = require('express');
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const bookCtrl = require('../controllers/book');

const router = express.Router();

// Lecture publique : pas besoin d'être connecté (spécifications de l'API)
router.get('/', bookCtrl.getAllBooks);
// /bestrating doit être déclarée avant /:id, sinon Express prendrait « bestrating » pour un id
router.get('/bestrating', bookCtrl.getBestRating);
router.get('/:id', bookCtrl.getOneBook);

// Écriture : auth vérifie le token AVANT multer, pour ne jamais enregistrer l'image d'un visiteur non connecté
router.post('/', auth, multer, bookCtrl.createBook);
router.put('/:id', auth, multer, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);

module.exports = router;

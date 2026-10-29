// Routes /api/books
const express = require('express');
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const bookCtrl = require('../controllers/book');

const router = express.Router();

// Lecture publique
router.get('/', bookCtrl.getAllBooks);
// Avant /:id, sinon « bestrating » serait pris pour un id
router.get('/bestrating', bookCtrl.getBestRating);
router.get('/:id', bookCtrl.getOneBook);

// Écriture : auth avant multer, pour ne pas enregistrer l'image d'un visiteur non connecté
router.post('/', auth, multer, bookCtrl.createBook);
router.put('/:id', auth, multer, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);
router.post('/:id/rating', auth, bookCtrl.rateBook);

module.exports = router;

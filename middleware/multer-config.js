// Middleware d'upload : reçoit l'image du formulaire (multer) puis l'optimise (sharp) avant de l'enregistrer
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

// Taille maximale du fichier reçu, avant optimisation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

// L'image reste en mémoire : sharp la retravaille, et seule la version optimisée arrive sur le disque
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
    } else {
      callback(new Error('Seules les images sont acceptées !'));
    }
  },
}).single('image'); // nom du champ envoyé par le front dans le FormData

module.exports = (req, res, next) => {
  upload(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    // Pas de fichier (modification d'un livre sans nouvelle image) : rien à optimiser
    if (!req.file) {
      return next();
    }

    // Nom unique : nom d'origine nettoyé + horodatage, extension .webp
    const name = path
      .parse(req.file.originalname)
      .name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${name}_${Date.now()}.webp`;

    // Green code : on réduit l'image à la taille utile pour le front (max 600 x 800 px, sans
    // l'agrandir) et on la convertit en WebP, bien plus léger que le JPEG ou le PNG
    sharp(req.file.buffer)
      .resize({ width: 600, height: 800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(__dirname, '..', 'images', filename))
      .then(() => {
        // Les contrôleurs utiliseront req.file.filename pour construire l'imageUrl
        req.file.filename = filename;
        next();
      })
      // Fichier annoncé comme image mais illisible par sharp
      .catch((error) => res.status(400).json({ error: error.message }));
  });
};

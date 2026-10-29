// Upload : reçoit l'image (multer), l'optimise et l'enregistre (sharp)
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

// Taille max avant optimisation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

// En mémoire : seule la version optimisée est écrite sur le disque
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
}).single('image'); // champ du FormData

module.exports = (req, res, next) => {
  upload(req, res, (error) => {
    // Remplace « File too large » de multer
    if (error?.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: "L'image ne doit pas dépasser 5 Mo !" });
    }
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    // Modification sans nouvelle image
    if (!req.file) {
      return next();
    }

    // Nom unique : nom nettoyé + horodatage
    const name = path
      .parse(req.file.originalname)
      .name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${name}_${Date.now()}.webp`;

    // Green code : max 600 x 800 px, sans agrandir, en WebP
    sharp(req.file.buffer)
      .resize({ width: 600, height: 800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(__dirname, '..', 'images', filename))
      .then(() => {
        // Sert à construire l'imageUrl
        req.file.filename = filename;
        next();
      })
      // Image illisible par sharp
      .catch((error) => res.status(400).json({ error: error.message }));
  });
};

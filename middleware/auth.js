// Middleware d'authentification : bloque la requête si le token JWT est absent ou invalide
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Sans en-tête, l'erreur JavaScript serait vide une fois convertie en JSON : on l'explicite
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Requête non authentifiée !' });
  }
  try {
    // Le front envoie l'en-tête « Authorization: Bearer <token> » : on garde la partie après l'espace
    const token = req.headers.authorization.split(' ')[1];
    // Vérifie la signature et la date d'expiration ; lève une erreur sinon
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    // Rend l'utilisateur connecté disponible pour les contrôleurs (vérification du propriétaire d'un livre)
    req.auth = { userId: decodedToken.userId };
    next();
  } catch (error) {
    res.status(401).json({ error });
  }
};
